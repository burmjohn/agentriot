import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniqueTaxonomySlug = vi.fn();
const normalizeTaxonomyInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/db/schema", () => ({
  taxonomyTerms: {
    id: "taxonomy_terms.id",
    slug: "taxonomy_terms.slug",
    scope: "taxonomy_terms.scope",
    kind: "taxonomy_terms.kind",
    name: "taxonomy_terms",
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
  ensureUniqueTaxonomySlug,
}));

vi.mock("@/lib/admin/taxonomy-input", () => ({
  normalizeTaxonomyInput,
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
        scope: "skill",
        kind: "tag",
        label: "Daily Ops",
        slug: "daily-ops",
        description: "Runbook-oriented workflows.",
        externalId: "taxonomy-1",
      }),
    )
    .digest("hex");
}

function buildTransactionMock({
  id = "taxonomy-1",
  slug = "daily-ops",
  scope = "skill",
  kind = "tag",
}: {
  id?: string;
  slug?: string;
  scope?: string;
  kind?: string;
} = {}) {
  return async (callback: (tx: {
    insert: (table: { name?: string }) => {
      values: (values: Record<string, unknown>) =>
        | {
            returning: () => Promise<
              Array<{ id: string; slug: string; scope: string; kind: string }>
            >;
          }
        | Promise<void>;
    };
  }) => Promise<unknown>) =>
    callback({
      insert(table: { name?: string }) {
        return {
          values(values: Record<string, unknown>) {
            if (table.name === "taxonomy_terms") {
              return {
                returning: vi.fn().mockResolvedValue([
                  {
                    id,
                    slug: typeof values.slug === "string" ? values.slug : slug,
                    scope: typeof values.scope === "string" ? values.scope : scope,
                    kind: typeof values.kind === "string" ? values.kind : kind,
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

describe("taxonomy ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueTaxonomySlug.mockResolvedValue("daily-ops");
    normalizeTaxonomyInput.mockReturnValue({
      scope: "skill",
      kind: "tag",
      label: "Daily Ops",
      slug: "daily-ops",
      description: "Runbook-oriented workflows.",
    });
  });

  it("creates a new taxonomy term and records the ingestion event", async () => {
    queueSelectResults([[]]);
    db.transaction.mockImplementation(await buildTransactionMock());

    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          description: "Runbook-oriented workflows.",
          externalId: "taxonomy-1",
        },
      }),
    ).resolves.toEqual({
      kind: "taxonomy",
      id: "taxonomy-1",
      slug: "daily-ops",
      scope: "skill",
      taxonomyKind: "tag",
      replayed: false,
    });
  });

  it("rejects unexpected fields", async () => {
    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
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
          createdRecordId: "taxonomy-1",
          status: "applied",
        },
      ],
      [
        {
          id: "taxonomy-1",
          slug: "daily-ops",
          scope: "skill",
          kind: "tag",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          description: "Runbook-oriented workflows.",
          externalId: "taxonomy-1",
        },
      }),
    ).resolves.toEqual({
      kind: "taxonomy",
      id: "taxonomy-1",
      slug: "daily-ops",
      scope: "skill",
      taxonomyKind: "tag",
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
          createdRecordId: "taxonomy-1",
          status: "applied",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          description: "Runbook-oriented workflows.",
          externalId: "taxonomy-1",
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

    const { ingestTaxonomyRecord } = await import("@/lib/ingestion/taxonomy-ingestion");

    await expect(
      ingestTaxonomyRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        payload: {
          scope: "skill",
          kind: "tag",
          label: "Daily Ops",
          description: "Runbook-oriented workflows.",
          externalId: "taxonomy-1",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_missing_record",
      status: 409,
    });
  });
});
