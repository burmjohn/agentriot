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
  contentItems: {
    id: "content_items.id",
    name: "content_items",
  },
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    scope: "taxonomy_terms.scope",
    name: "taxonomy_terms",
  },
  contentTaxonomyTerms: {
    contentItemId: "content_taxonomy_terms.content_item_id",
    taxonomyTermId: "content_taxonomy_terms.taxonomy_term_id",
    name: "content_taxonomy_terms",
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
        contentId: "content-1",
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

describe("content taxonomy assignment ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("replaces content taxonomy assignments and records the ingestion event", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [
        { id: "term-b", scope: "content" },
        { id: "term-a", scope: "content" },
      ],
    ]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: false,
    });

    expect(replaceJoinRows).toHaveBeenCalledOnce();
    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      deleteTable: expect.objectContaining({ name: "content_taxonomy_terms" }),
      insertTable: expect.objectContaining({ name: "content_taxonomy_terms" }),
      insertValues: [
        { contentItemId: "content-1", taxonomyTermId: "term-a" },
        { contentItemId: "content-1", taxonomyTermId: "term-b" },
      ],
    });
  });

  it("allows clearing all taxonomy assignments with an empty array", async () => {
    queueSelectResults([[], [{ id: "content-1" }], []]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-clear",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: [],
        },
      }),
    ).resolves.toEqual({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: [],
      replayed: false,
    });

    expect(replaceJoinRows.mock.calls[0]?.[0]).toMatchObject({
      insertValues: [],
    });
  });

  it("rejects unexpected fields", async () => {
    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: ["term-a"],
          unsupported: "nope",
        } as never,
      }),
    ).rejects.toMatchObject({
      code: "invalid_payload",
      status: 400,
    });
  });

  it("rejects requests when the content item does not exist", async () => {
    queueSelectResults([[], []]);

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "missing-content",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "content_not_found",
      status: 404,
    });
  });

  it("rejects taxonomy terms from the wrong scope", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [{ id: "term-a", scope: "skill" }],
    ]);

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
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
      [{ id: "content-1" }],
      [
        { id: "term-b", scope: "content" },
        { id: "term-a", scope: "content" },
      ],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: ["term-b", "term-a", "term-b"],
        },
      }),
    ).resolves.toEqual({
      kind: "content-taxonomy",
      contentId: "content-1",
      taxonomyTermIds: ["term-a", "term-b"],
      replayed: true,
    });
  });

  it("returns a conflict when the duplicate idempotency key points at a different payload", async () => {
    queueSelectResults([
      [],
      [{ id: "content-1" }],
      [{ id: "term-a", scope: "content" }],
      [
        {
          id: "evt-1",
          payloadHash: "different-hash",
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
    ]);
    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { assignContentTaxonomy } = await import(
      "@/lib/ingestion/content-taxonomy-assignment"
    );

    await expect(
      assignContentTaxonomy({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          contentId: "content-1",
          taxonomyTermIds: ["term-a"],
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });
});
