import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = {
  select: vi.fn(),
  transaction: vi.fn(),
};

const ensureUniqueContentSlug = vi.fn();
const createContentRevisionSnapshot = vi.fn();
const normalizeContentInput = vi.fn();

vi.mock("@/db", () => ({
  db,
}));

vi.mock("@/lib/admin/cms", () => ({
  ensureUniqueContentSlug,
}));

vi.mock("@/lib/admin/content-revisions", () => ({
  createContentRevisionSnapshot,
}));

vi.mock("@/lib/admin/record-input", () => ({
  normalizeContentInput,
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
        kind: "article",
        title: "Weekly signal",
        slug: "weekly-signal",
        subtype: "news",
        status: "published",
        excerpt: "Fresh updates.",
        body: "Release notes.",
        heroImageUrl: null,
        canonicalUrl: null,
        seoTitle: null,
        seoDescription: null,
        publishedAt: "2026-03-28T00:00:00.000Z",
        scheduledFor: null,
        externalId: null,
      }),
    )
    .digest("hex");
}

describe("content ingestion service", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    ensureUniqueContentSlug.mockResolvedValue("weekly-signal");
    normalizeContentInput.mockReturnValue({
      kind: "article",
      title: "Weekly signal",
      slug: "weekly-signal",
      subtype: "news",
      status: "published",
      excerpt: "Fresh updates.",
      body: "Release notes.",
      heroImageUrl: null,
      canonicalUrl: null,
      seoTitle: null,
      seoDescription: null,
      publishedAt: new Date("2026-03-28T00:00:00.000Z"),
      scheduledFor: null,
    });
  });

  it("replays deterministically when a concurrent request trips the idempotency unique index", async () => {
    queueSelectResults([
      [],
      [
        {
          id: "evt-1",
          payloadHash: buildExpectedPayloadHash(),
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
      [
        {
          id: "content-1",
          slug: "weekly-signal",
          status: "published",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestContentRecord } = await import("@/lib/ingestion/content-ingestion");

    await expect(
      ingestContentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        kind: "article",
        payload: {
          title: "Weekly signal",
          status: "published",
          subtype: "news",
          excerpt: "Fresh updates.",
          body: "Release notes.",
        },
      }),
    ).resolves.toEqual({
      kind: "article",
      id: "content-1",
      slug: "weekly-signal",
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
          createdRecordId: "content-1",
          status: "applied",
        },
      ],
    ]);

    db.transaction.mockRejectedValue({
      code: "23505",
      constraint: "ingestion_events_api_key_idempotency_idx",
    });

    const { ingestContentRecord } = await import("@/lib/ingestion/content-ingestion");

    await expect(
      ingestContentRecord({
        apiKeyId: "key-1",
        idempotencyKey: "evt-1",
        kind: "article",
        payload: {
          title: "Weekly signal",
          status: "published",
          subtype: "news",
          excerpt: "Fresh updates.",
          body: "Release notes.",
        },
      }),
    ).rejects.toMatchObject({
      code: "idempotency_conflict",
      status: 409,
    });
  });
});
