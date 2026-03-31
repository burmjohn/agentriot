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
  prompts: {
    id: "prompts.id",
    name: "prompts",
  },
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    scope: "taxonomy_terms.scope",
    name: "taxonomy_terms",
  },
  promptTaxonomyTerms: {
    promptId: "prompt_taxonomy_terms.prompt_id",
    taxonomyTermId: "prompt_taxonomy_terms.taxonomy_term_id",
    name: "prompt_taxonomy_terms",
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
        promptId: "prompt-1",
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

describe("prompt taxonomy assignment ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces prompt taxonomy assignments and records the ingestion event", async () => {
    queueSelectResults([
      [],
      [{ id: "prompt-1" }],
      [
        { id: "term-b", scope: "prompt" },
        { id: "term-a", scope: "prompt" },
      ],
    ]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "prompt-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "prompt-taxonomy",
      promptId: "prompt-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: false,
    });

    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "prompt_taxonomy_terms" }),
      insertTable: expect.objectContaining({ name: "prompt_taxonomy_terms" }),
      insertValues: [
        { promptId: "prompt-1", taxonomyTermId: "term-a" },
        { promptId: "prompt-1", taxonomyTermId: "term-b" },
      ],
    });
  });

  it("allows clearing all taxonomy assignments with an empty array", async () => {
    queueSelectResults([[], [{ id: "prompt-1" }], []]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-clear",
        payload: {
          promptId: "prompt-1",
          taxonomyTermIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "prompt-taxonomy",
      promptId: "prompt-1",
      taxonomyTermIds: [],
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "prompt-1",
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
    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: null as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects requests when the prompt does not exist", async () => {
    queueSelectResults([[], []]);

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "missing-prompt",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "prompt_not_found",
      status: 404,
    });
  });

  it("rejects taxonomy terms from the wrong scope", async () => {
    queueSelectResults([
      [],
      [{ id: "prompt-1" }],
      [{ id: "term-a", scope: "skill" }],
    ]);

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "prompt-1",
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
      [{ id: "prompt-1" }],
      [
        { id: "term-b", scope: "prompt" },
        { id: "term-a", scope: "prompt" },
      ],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "prompt-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "prompt-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "prompt-taxonomy",
      promptId: "prompt-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [{ id: "prompt-1" }],
      [{ id: "term-a", scope: "prompt" }],
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

    const { assignPromptTaxonomy } = await import(
      "@/lib/ingestion/prompt-taxonomy-assignment"
    );

    await expect(
      assignPromptTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          promptId: "prompt-1",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });
});
