import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const replaceJoinRows = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  skills: {
    id: "skills.id",
    name: "skills",
  },
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    scope: "taxonomy_terms.scope",
    name: "taxonomy_terms",
  },
  skillTaxonomyTerms: {
    skillId: "skill_taxonomy_terms.skill_id",
    taxonomyTermId: "skill_taxonomy_terms.taxonomy_term_id",
    name: "skill_taxonomy_terms",
  },
  ingestionEvents: {
    id: "ingestion_events.id",
    payloadHash: "ingestion_events.payload_hash",
    createdRecordId: "ingestion_events.created_record_id",
    status: "ingestion_events.status",
    apiKeyId: "ingestion_events.api_key_id",
    idempotencyKey: "ingestion_events.idempotency_key",
    action: "ingestion_events.action",
    target: "ingestion_events.target",
    name: "ingestion_events",
  },
}));

vi.mock("@/lib/admin/relation-writes", () => ({
  replaceJoinRows,
}));

function queueSelectResults(results: unknown[]) {
  db.select.mockImplementation(() => {
    const next = results.shift();
    const resolved = Promise.resolve(next);

    return {
      from() {
        return {
          where() {
            const query = {
              limit: vi.fn().mockResolvedValue(next),
              then: resolved.then.bind(resolved),
              catch: resolved.catch.bind(resolved),
              finally: resolved.finally.bind(resolved),
              [Symbol.toStringTag]: "Promise",
            };

            return query;
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
        skillId: "skill-1",
        taxonomyTermIds: ["term-a", "term-b"],
      }),
    )
    .digest("hex");
}

function buildTransactionMock() {
  return async (
    callback: (tx: {
      insert: (table: { name?: string }) => {
        values: (values: Record<string, unknown>) => Promise<void>;
      };
      delete: typeof vi.fn;
    }) => Promise<unknown>,
  ) =>
    callback({
      insert() {
        return {
          values: vi.fn().mockResolvedValue(undefined),
        };
      },
      delete: vi.fn(),
    });
}

describe("skill taxonomy assignment ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces skill taxonomy assignments and records the ingestion event", async () => {
    queueSelectResults([
      [],
      [{ id: "skill-1" }],
      [
        { id: "term-b", scope: "skill" },
        { id: "term-a", scope: "skill" },
      ],
    ]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "skill-taxonomy",
      skillId: "skill-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: false,
    });

    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "skill_taxonomy_terms" }),
      insertTable: expect.objectContaining({ name: "skill_taxonomy_terms" }),
      insertValues: [
        { skillId: "skill-1", taxonomyTermId: "term-a" },
        { skillId: "skill-1", taxonomyTermId: "term-b" },
      ],
    });
  });

  it("allows clearing all taxonomy assignments with an empty array", async () => {
    queueSelectResults([[], [{ id: "skill-1" }], []]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-clear",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "skill-taxonomy",
      skillId: "skill-1",
      taxonomyTermIds: [],
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: ["term-a"],
          unsupported: "nope",
        } as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects non-object payloads with a stable invalid-payload error", async () => {
    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: null as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects requests when the skill does not exist", async () => {
    queueSelectResults([[], []]);

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "missing-skill",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "skill_not_found",
      status: 404,
    });
  });

  it("rejects taxonomy terms from the wrong scope", async () => {
    queueSelectResults([
      [],
      [{ id: "skill-1" }],
      [{ id: "term-a", scope: "prompt" }],
    ]);

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "invalid_taxonomy_scope",
      status: 400,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [{ id: "skill-1" }],
      [
        { id: "term-b", scope: "skill" },
        { id: "term-a", scope: "skill" },
      ],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "skill-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "skill-taxonomy",
      skillId: "skill-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [{ id: "skill-1" }],
      [{ id: "term-a", scope: "skill" }],
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

    const { assignSkillTaxonomy } = await import(
      "@/lib/ingestion/skill-taxonomy-assignment"
    );

    await expect(
      assignSkillTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          skillId: "skill-1",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });
});
