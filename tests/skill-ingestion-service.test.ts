import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniqueSkillSlug = vi.fn();
const normalizeSkillInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  skills: {
    id: "skills.id",
    slug: "skills.slug",
    status: "skills.status",
    name: "skills",
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
  ensureUniqueSkillSlug,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizeSkillInput,
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
        title: "Repo triage",
        slug: "repo-triage",
        status: "published",
        shortDescription: "Triage repository issues quickly.",
        longDescription: "Uses AI to summarize bug clusters and risk areas.",
        websiteUrl: "https://agentriot.test/skills/repo-triage",
        githubUrl: "https://github.com/burmjohn/agentriot",
        externalId: "skill-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "skill-1",
  slug = "repo-triage",
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
            if (table.name === "skills") {
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

describe("skill ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueSkillSlug.mockResolvedValue("repo-triage");
    normalizeSkillInput.mockReturnValue({
      title: "Repo triage",
      slug: "repo-triage",
      status: "published",
      shortDescription: "Triage repository issues quickly.",
      longDescription: "Uses AI to summarize bug clusters and risk areas.",
      websiteUrl: "https://agentriot.test/skills/repo-triage",
      githubUrl: "https://github.com/burmjohn/agentriot",
    });
  });

  it("creates a new skill and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
        },
      }),
    ).resolves.toEqual({
      kind: "skill",
      id: "skill-1",
      slug: "repo-triage",
      status: "published",
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          unsupported: "nope",
        } as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "skill-1",
          status: "applied",
        },
      ],
      [
        {
          id: "skill-1",
          slug: "repo-triage",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
        },
      }),
    ).resolves.toEqual({
      kind: "skill",
      id: "skill-1",
      slug: "repo-triage",
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
          createdRecordId: "skill-1",
          status: "applied",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
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

    const { ingestSkillRecord } = await import("@/lib/ingestion/skill-ingestion");

    await expect(
      ingestSkillRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          title: "Repo triage",
          status: "published",
          shortDescription: "Triage repository issues quickly.",
          longDescription: "Uses AI to summarize bug clusters and risk areas.",
          websiteUrl: "https://agentriot.test/skills/repo-triage",
          githubUrl: "https://github.com/burmjohn/agentriot",
          externalId: "skill-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_missing_record",
      status: 409,
    });
  });
});
