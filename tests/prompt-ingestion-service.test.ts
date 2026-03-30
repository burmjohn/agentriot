import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniquePromptSlug = vi.fn();
const normalizePromptInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  prompts: {
    id: "prompts.id",
    slug: "prompts.slug",
    status: "prompts.status",
    name: "prompts",
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
  ensureUniquePromptSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizePromptInput,
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
        title: "Repo triage prompt",
        slug: "repo-triage-prompt",
        status: "published",
        shortDescription: "Summarize repo state fast.",
        fullDescription: null,
        promptBody: "Summarize the repository and highlight risk.",
        providerCompatibility: "openai,anthropic",
        variablesSchema: null,
        exampleOutput: null,
        externalId: "prompt-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "prompt-1",
  slug = "repo-triage-prompt",
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
            if (table.name === "prompts") {
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

describe("prompt ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniquePromptSlug.mockResolvedValue("repo-triage-prompt");
    normalizePromptInput.mockReturnValue({
      title: "Repo triage prompt",
      slug: "repo-triage-prompt",
      status: "published",
      shortDescription: "Summarize repo state fast.",
      fullDescription: null,
      promptBody: "Summarize the repository and highlight risk.",
      providerCompatibility: "openai,anthropic",
      variablesSchema: null,
      exampleOutput: null,
    });
  });

  it("creates a new prompt and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
        },
      }),
    ).resolves.toEqual({
      kind: "prompt",
      id: "prompt-1",
      slug: "repo-triage-prompt",
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
          createdRecordId: "prompt-1",
          status: "applied",
        },
      ],
      [
        {
          id: "prompt-1",
          slug: "repo-triage-prompt",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
        },
      }),
    ).resolves.toEqual({
      kind: "prompt",
      id: "prompt-1",
      slug: "repo-triage-prompt",
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
          createdRecordId: "prompt-1",
          status: "applied",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
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

    const { ingestPromptRecord } = await import("@/lib/ingestion/prompt-ingestion");

    await expect(
      ingestPromptRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage prompt",
          status: "published",
          shortDescription: "Summarize repo state fast.",
          promptBody: "Summarize the repository and highlight risk.",
          providerCompatibility: "openai,anthropic",
          externalId: "prompt-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_missing_record",
      status: 409,
    });
  });
});
