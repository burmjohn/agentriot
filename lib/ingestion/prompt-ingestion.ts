import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, prompts } from "@/db/schema";
import { ensureUniquePromptSlug } from "@/lib/admin/cms";
import { normalizePromptInput } from "@/lib/admin/record-input";

export type PromptIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  promptBody: string;
  providerCompatibility?: string | null;
  variablesSchema?: string | null;
  exampleOutput?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedPromptPayloadKeys = new Set([
  "title",
  "slug",
  "status",
  "shortDescription",
  "fullDescription",
  "promptBody",
  "providerCompatibility",
  "variablesSchema",
  "exampleOutput",
  "externalId",
]);

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

function assertNoUnknownPromptFields(payload: Record<string, unknown>) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !allowedPromptPayloadKeys.has(field),
  );

  if (unknownFields.length === 0) {
    return;
  }

  throw createKnownError(
    `Unexpected prompt ingestion fields: ${unknownFields.join(", ")}.`,
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
      "Idempotent prompt record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingPrompt] = await db
    .select({
      id: prompts.id,
      slug: prompts.slug,
      status: prompts.status,
    })
    .from(prompts)
    .where(eq(prompts.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingPrompt) {
    throw createKnownError(
      "Idempotent prompt record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "prompt" as const,
    id: existingPrompt.id,
    slug: existingPrompt.slug,
    status: existingPrompt.status,
    replayed: true,
  };
}

export async function ingestPromptRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: PromptIngestionPayload;
}) {
  assertNoUnknownPromptFields(payload as Record<string, unknown>);
  const normalized = normalizePromptInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    fullDescription: normalized.fullDescription,
    promptBody: normalized.promptBody,
    providerCompatibility: normalized.providerCompatibility,
    variablesSchema: normalized.variablesSchema,
    exampleOutput: normalized.exampleOutput,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniquePromptSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [prompt] = await tx
        .insert(prompts)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "prompt",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: prompt.id,
      });

      return prompt;
    });

    return {
      kind: "prompt" as const,
      id: created.id,
      slug: created.slug,
      status: created.status,
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
