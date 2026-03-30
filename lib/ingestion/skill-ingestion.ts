import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { ingestionEvents, skills } from "@/db/schema";
import { ensureUniqueSkillSlug } from "@/lib/admin/cms";
import { normalizeSkillInput } from "@/lib/admin/record-input";

export type SkillIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  externalId?: string | null;
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedSkillPayloadKeys = new Set([
  "title",
  "slug",
  "status",
  "shortDescription",
  "longDescription",
  "websiteUrl",
  "githubUrl",
  "externalId",
]);

function buildPayloadHash(payload: Record<string, unknown>) {
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function createKnownError(message: string, status: number, code: string) {
  return Object.assign(new Error(message), { status, code });
}

function assertNoUnknownSkillFields(payload: Record<string, unknown>) {
  const unknownFields = Object.keys(payload).filter(
    (field) => !allowedSkillPayloadKeys.has(field),
  );

  if (unknownFields.length === 0) {
    return;
  }

  throw createKnownError(
    `Unexpected skill ingestion fields: ${unknownFields.join(", ")}.`,
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
      "Idempotent skill record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingSkill] = await db
    .select({
      id: skills.id,
      slug: skills.slug,
      status: skills.status,
    })
    .from(skills)
    .where(eq(skills.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingSkill) {
    throw createKnownError(
      "Idempotent skill record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "skill" as const,
    id: existingSkill.id,
    slug: existingSkill.slug,
    status: existingSkill.status,
    replayed: true,
  };
}

export async function ingestSkillRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: SkillIngestionPayload;
}) {
  assertNoUnknownSkillFields(payload as Record<string, unknown>);
  const normalized = normalizeSkillInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    longDescription: normalized.longDescription,
    websiteUrl: normalized.websiteUrl,
    githubUrl: normalized.githubUrl,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueSkillSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [skill] = await tx
        .insert(skills)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "skill",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: skill.id,
      });

      return skill;
    });

    return {
      kind: "skill" as const,
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
