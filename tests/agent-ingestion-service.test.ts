import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniqueAgentSlug = vi.fn();
const normalizeAgentInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  agents: {
    id: "agents.id",
    slug: "agents.slug",
    status: "agents.status",
    name: "agents",
  },
  ingestionEvents: {
    id: "ingestion_events.id",
    payloadHash: "ingestion_events.payload_hash",
    createdRecordId: "ingestion_events.created_record_id",
    status: "ingestion_events.status",
    apiKeyId: "ingestion_events.api_key_id",
    idempotencyKey: "ingestion_events.idempotency_key",
    name: "ingestion_events",
  },
}));

vi.mock("@/lib/admin/cms", () => ({
  ensureUniqueAgentSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizeAgentInput,
}));

function queueSelectResults(results: unknown[]) {
  db.select.mockImplementation(() => {
    const next = results.shift();

    return {
      from() {
        return {
          where() {
            return {
              limit: vi.fn().mockResolvedValue(next),
            };
          },
        };
      },
    };
  });
}

function buildExpectedPayloadHash() {
  return createHash("sha256")
    .update(
      JSON.stringify({
        title: "Claude Code",
        slug: "claude-code",
        status: "published",
        shortDescription: "Agentic coding assistant",
        longDescription: null,
        websiteUrl: "https://example.com/claude-code",
        githubUrl: null,
        pricingNotes: null,
        externalId: "agent-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "agent-1",
  slug = "claude-code",
  status = "published",
}: {
  id?: string;
  slug?: string;
  status?: string;
} = {}) {
  return async (callback: (tx: {
    insert: (table: { name?: string }) => {
      values: (values: Record<string, unknown>) =>
        | { returning: () => Promise<Array<{ id: string; slug: string; status: string }>> }
        | Promise<void>;
    };
  }) => Promise<unknown>) =>
    callback({
      insert(table: { name?: string }) {
        return {
          values(values: Record<string, unknown>) {
            if (table.name === "agents") {
              return {
                returning: vi.fn().mockResolvedValue([
                  {
                    id,
                    slug: typeof values.slug === "string" ? values.slug : slug,
                    status:
                      typeof values.status === "string" ? values.status : status,
                  },
                ]),
              };
            }

            return Promise.resolve(undefined);
          },
        };
      },
    });
}

describe("agent ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueAgentSlug.mockResolvedValue("claude-code");
    normalizeAgentInput.mockReturnValue({
      title: "Claude Code",
      slug: "claude-code",
      status: "published",
      shortDescription: "Agentic coding assistant",
      longDescription: null,
      websiteUrl: "https://example.com/claude-code",
      githubUrl: null,
      pricingNotes: null,
    });
  });

  it("creates a new agent and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).resolves.toEqual({
      kind: "agent",
      id: "agent-1",
      slug: "claude-code",
      status: "published",
      replayed: false,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "agent-1",
          status: "applied",
        },
      ],
      [
        {
          id: "agent-1",
          slug: "claude-code",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).resolves.toEqual({
      kind: "agent",
      id: "agent-1",
      slug: "claude-code",
      status: "published",
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: "different-hash",
          createdRecordId: "agent-1",
          status: "applied",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });

  it("returns a missing-record error when the replay event has no created record", async () => {
    queueSelectResults([
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: null,
          status: "applied",
        },
      ],
    ]);

    const { ingestAgentRecord } = await import("@/lib/ingestion/agent-ingestion");

    await expect(
      ingestAgentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Claude Code",
          status: "published",
          shortDescription: "Agentic coding assistant",
          websiteUrl: "https://example.com/claude-code",
          externalId: "agent-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_missing_record",
      status: 409,
    });
  });
});
