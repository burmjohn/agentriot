import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, taxonomyTerms } from "@/db/schema";
import { ensureUniqueTaxonomySlug } from "@/lib/admin/cms";
import { normalizeTaxonomyInput } from "@/lib/admin/taxonomy-input";

export type TaxonomyIngestionPayload = {
  scope: "content" | "agent" | "prompt" | "skill";
  kind: "category" | "tag" | "type";
  label: string;
  slug?: string | null;
  description?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedTaxonomyPayloadKeys = new Set([
  "scope",
  "kind",
  "label",
  "slug",
  "description",
  "externalId",
]);

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

function assertNoUnknownTaxonomyFields(payload: Record<string, unknown>) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !allowedTaxonomyPayloadKeys.has(field),
  );

  if (unknownFields.length === 0) {
    return;
  }

  throw createKnownError(
    `Unexpected taxonomy ingestion fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
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
}: {
  existingEvent: IngestionLookup;
  payloadHash: string;
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
      "Idempotent taxonomy record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingTerm] = await db
    .select({
      id: taxonomyTerms.id,
      slug: taxonomyTerms.slug,
      scope: taxonomyTerms.scope,
      kind: taxonomyTerms.kind,
    })
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingTerm) {
    throw createKnownError(
      "Idempotent taxonomy record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "taxonomy" as const,
    id: existingTerm.id,
    slug: existingTerm.slug,
    scope: existingTerm.scope,
    taxonomyKind: existingTerm.kind,
    replayed: true,
  };
}

export async function ingestTaxonomyRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: TaxonomyIngestionPayload;
}) {
  assertNoUnknownTaxonomyFields(payload as Record<string, unknown>);
  const normalized = normalizeTaxonomyInput(payload);
  const payloadHash = buildPayloadHash({
    scope: normalized.scope,
    kind: normalized.kind,
    label: normalized.label,
    slug: normalized.slug,
    description: normalized.description,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueTaxonomySlug(
    normalized.scope,
    normalized.kind,
    normalized.slug,
  );

  try {
    const created = await db.transaction(async (tx) => {
      const [term] = await tx
        .insert(taxonomyTerms)
        .values({
          ...normalized,
          slug,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "taxonomy",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: term.id,
      });

      return term;
    });

    return {
      kind: "taxonomy" as const,
      id: created.id,
      slug: created.slug,
      scope: created.scope,
      taxonomyKind: created.kind,
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
    });
  }
}
