import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  contentItems,
  contentTaxonomyTerms,
  ingestionEvents,
  taxonomyTerms,
} from "@/db/schema";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

export type ContentTaxonomyAssignmentPayload = {
  contentId: string;
  taxonomyTermIds: string[];
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedPayloadKeys = new Set(["contentId", "taxonomyTermIds"]);

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

function assertNoUnknownFields(payload: Record<string, unknown>) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw createKnownError("Request body must be a JSON object.", 400, "invalid_payload");
  }

  const unknownFields = Object.keys(payload).filter((field) => !allowedPayloadKeys.has(field));

  if (unknownFields.length === 0) {
    return;
  }

  throw createKnownError(
    `Unexpected content taxonomy assignment fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
}

function normalizePayload(payload: ContentTaxonomyAssignmentPayload) {
  if (typeof payload.contentId !== "string" || payload.contentId.trim().length === 0) {
    throw createKnownError("contentId is required.", 400, "invalid_payload");
  }

  if (!Array.isArray(payload.taxonomyTermIds)) {
    throw createKnownError("taxonomyTermIds must be an array.", 400, "invalid_payload");
  }

  const taxonomyTermIds = [...new Set(payload.taxonomyTermIds)]
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean)
    .sort();

  if (taxonomyTermIds.length !== payload.taxonomyTermIds.length) {
    const hasInvalidValue = payload.taxonomyTermIds.some(
      (id) => typeof id !== "string" || id.trim().length === 0,
    );

    if (hasInvalidValue) {
      throw createKnownError(
        "taxonomyTermIds must contain only non-empty string IDs.",
        400,
        "invalid_payload",
      );
    }
  }

  return {
    contentId: payload.contentId.trim(),
    taxonomyTermIds,
  };
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
  normalized,
}: {
  existingEvent: IngestionLookup;
  payloadHash: string;
  normalized: { contentId: string; taxonomyTermIds: string[] };
}) {
  if (existingEvent.payloadHash !== payloadHash) {
    throw createKnownError(
      "Payload differs from the original idempotent request.",
      409,
      "idempotency_conflict",
    );
  }

  if (existingEvent.createdRecordId !== normalized.contentId) {
    throw createKnownError(
      "Idempotent content taxonomy target could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "content-taxonomy" as const,
    contentId: normalized.contentId,
    taxonomyTermIds: normalized.taxonomyTermIds,
    replayed: true,
  };
}

async function ensureContentExists(contentId: string) {
  const [content] = await db
    .select({ id: contentItems.id })
    .from(contentItems)
    .where(eq(contentItems.id, contentId))
    .limit(1);

  if (content) {
    return;
  }

  throw createKnownError("Content record could not be found.", 404, "content_not_found");
}

async function ensureValidContentTaxonomyTerms(taxonomyTermIds: string[]) {
  if (taxonomyTermIds.length === 0) {
    return;
  }

  const terms = await db
    .select({
      id: taxonomyTerms.id,
      scope: taxonomyTerms.scope,
    })
    .from(taxonomyTerms)
    .where(inArray(taxonomyTerms.id, taxonomyTermIds));

  if (terms.length !== taxonomyTermIds.length) {
    throw createKnownError(
      "One or more taxonomy terms could not be found.",
      404,
      "taxonomy_term_not_found",
    );
  }

  if (terms.some((term) => term.scope !== "content")) {
    throw createKnownError(
      "All taxonomy terms must have scope=content.",
      400,
      "invalid_taxonomy_scope",
    );
  }
}

export async function assignContentTaxonomy({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: ContentTaxonomyAssignmentPayload;
}) {
  assertNoUnknownFields(payload as Record<string, unknown>);
  const normalized = normalizePayload(payload);
  const payloadHash = buildPayloadHash(normalized);

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
      normalized,
    });
  }

  await ensureContentExists(normalized.contentId);
  await ensureValidContentTaxonomyTerms(normalized.taxonomyTermIds);

  try {
    await db.transaction(async (tx) => {
      await replaceJoinRows({
        database: tx,
        deleteTable: contentTaxonomyTerms,
        deleteWhere: eq(contentTaxonomyTerms.contentItemId, normalized.contentId),
        insertTable: contentTaxonomyTerms,
        insertValues: normalized.taxonomyTermIds.map((taxonomyTermId) => ({
          contentItemId: normalized.contentId,
          taxonomyTermId,
        })),
      });

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "content",
        action: "replace_taxonomy",
        idempotencyKey,
        externalId: null,
        payload: normalized,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: normalized.contentId,
      });
    });

    return {
      kind: "content-taxonomy" as const,
      contentId: normalized.contentId,
      taxonomyTermIds: normalized.taxonomyTermIds,
      replayed: false,
    };
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
      normalized,
    });
  }
}
