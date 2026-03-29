import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { contentItems, ingestionEvents, type contentKindEnum } from "@/db/schema";
import { createContentRevisionSnapshot } from "@/lib/admin/content-revisions";
import { ensureUniqueContentSlug } from "@/lib/admin/cms";
import { normalizeContentInput } from "@/lib/admin/record-input";

type ContentKind = (typeof contentKindEnum.enumValues)[number];

export type ContentIngestionPayload = {
  title: string;
  slug?: string | null;
  subtype?: string | null;
  status: string;
  excerpt?: string | null;
  body?: string | null;
  heroImageUrl?: string | null;
  canonicalUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: string | null;
  scheduledFor?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

function isIdempotencyConstraintError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505" &&
    "constraint" in error &&
    error.constraint === "ingestion_events_api_key_idempotency_idx"
  );
}

async function findExistingIngestionEvent(apiKeyId: string, idempotencyKey: string) {
  const [existingEvent] = await db
    .select({
      id: ingestionEvents.id,
      payloadHash: ingestionEvents.payloadHash,
      createdRecordId: ingestionEvents.createdRecordId,
      status: ingestionEvents.status,
    })
    .from(ingestionEvents)
    .where(
      and(
        eq(ingestionEvents.apiKeyId, apiKeyId),
        eq(ingestionEvents.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return existingEvent ?? null;
}

async function buildReplayResult({
  existingEvent,
  payloadHash,
  kind,
}: {
  existingEvent: IngestionLookup;
  payloadHash: string;
  kind: ContentKind;
}) {
  if (existingEvent.payloadHash !== payloadHash) {
    throw createKnownError(
      "Payload differs from the original idempotent request.",
      409,
      "idempotency_conflict",
    );
  }

  if (!existingEvent.createdRecordId) {
    throw createKnownError(
      "Idempotent content record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingContent] = await db
    .select({
      id: contentItems.id,
      slug: contentItems.slug,
      status: contentItems.status,
    })
    .from(contentItems)
    .where(eq(contentItems.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingContent) {
    throw createKnownError(
      "Idempotent content record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind,
    id: existingContent.id,
    slug: existingContent.slug,
    status: existingContent.status,
    replayed: true,
  };
}

export async function ingestContentRecord({
  apiKeyId,
  idempotencyKey,
  kind,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  kind: ContentKind;
  payload: ContentIngestionPayload;
}) {
  const normalized = normalizeContentInput({
    kind,
    ...payload,
  });
  const payloadHash = buildPayloadHash({
    kind,
    title: normalized.title,
    slug: normalized.slug,
    subtype: normalized.subtype,
    status: normalized.status,
    excerpt: normalized.excerpt,
    body: normalized.body,
    heroImageUrl: normalized.heroImageUrl,
    canonicalUrl: normalized.canonicalUrl,
    seoTitle: normalized.seoTitle,
    seoDescription: normalized.seoDescription,
    publishedAt: normalized.publishedAt?.toISOString() ?? null,
    scheduledFor: normalized.scheduledFor?.toISOString() ?? null,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
      kind,
    });
  }

  const slug = await ensureUniqueContentSlug(normalized.slug, kind);

  let created;

  try {
    created = await db.transaction(async (tx) => {
      const [content] = await tx
        .insert(contentItems)
        .values({
          ...normalized,
          slug,
        })
        .returning();

      await createContentRevisionSnapshot({
        database: tx,
        contentItem: content,
        editedById: null,
      });

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "content",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload: {
          kind,
          ...payload,
        },
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: content.id,
      });

      return content;
    });
  } catch (error) {
    if (!isIdempotencyConstraintError(error)) {
      throw error;
    }

    const replayEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

    if (!replayEvent) {
      throw error;
    }

    return buildReplayResult({
      existingEvent: replayEvent,
      payloadHash,
      kind,
    });
  }

  return {
    kind,
    id: created.id,
    slug: created.slug,
    status: created.status,
    replayed: false,
  };
}
