import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  agents,
  contentAgents,
  contentItems,
  contentPrompts,
  contentSkills,
  ingestionEvents,
  prompts,
  skills,
} from "@/db/schema";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

export type ContentRelationsPayload = {
  contentId: string;
  agentIds: string[];
  promptIds: string[];
  skillIds: string[];
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedPayloadKeys = new Set(["contentId", "agentIds", "promptIds", "skillIds"]);

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
    `Unexpected content relation fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
}

function normalizeIdArray(
  value: unknown,
  fieldName: "agentIds" | "promptIds" | "skillIds",
) {
  if (!Array.isArray(value)) {
    throw createKnownError(`${fieldName} must be an array.`, 400, "invalid_payload");
  }

  const normalized = [...new Set(value)]
    .map((id) => (typeof id === "string" ? id.trim() : ""))
    .filter(Boolean)
    .sort();

  if (normalized.length !== value.length) {
    const hasInvalidValue = value.some((id) => typeof id !== "string" || id.trim().length === 0);

    if (hasInvalidValue) {
      throw createKnownError(
        `${fieldName} must contain only non-empty string IDs.`,
        400,
        "invalid_payload",
      );
    }
  }

  return normalized;
}

function normalizePayload(payload: ContentRelationsPayload) {
  if (typeof payload.contentId !== "string" || payload.contentId.trim().length === 0) {
    throw createKnownError("contentId is required.", 400, "invalid_payload");
  }

  return {
    contentId: payload.contentId.trim(),
    agentIds: normalizeIdArray(payload.agentIds, "agentIds"),
    promptIds: normalizeIdArray(payload.promptIds, "promptIds"),
    skillIds: normalizeIdArray(payload.skillIds, "skillIds"),
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
  normalized: {
    contentId: string;
    agentIds: string[];
    promptIds: string[];
    skillIds: string[];
  };
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
      "Idempotent content relations target could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "content-relations" as const,
    contentId: normalized.contentId,
    agentIds: normalized.agentIds,
    promptIds: normalized.promptIds,
    skillIds: normalized.skillIds,
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

async function ensureAgentIdsExist(agentIds: string[]) {
  if (agentIds.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: agents.id })
    .from(agents)
    .where(inArray(agents.id, agentIds));

  if (rows.length === agentIds.length) {
    return;
  }

  throw createKnownError("One or more agents could not be found.", 404, "agent_not_found");
}

async function ensurePromptIdsExist(promptIds: string[]) {
  if (promptIds.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(inArray(prompts.id, promptIds));

  if (rows.length === promptIds.length) {
    return;
  }

  throw createKnownError("One or more prompts could not be found.", 404, "prompt_not_found");
}

async function ensureSkillIdsExist(skillIds: string[]) {
  if (skillIds.length === 0) {
    return;
  }

  const rows = await db
    .select({ id: skills.id })
    .from(skills)
    .where(inArray(skills.id, skillIds));

  if (rows.length === skillIds.length) {
    return;
  }

  throw createKnownError("One or more skills could not be found.", 404, "skill_not_found");
}

export async function assignContentRelations({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: ContentRelationsPayload;
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
  await ensureAgentIdsExist(normalized.agentIds);
  await ensurePromptIdsExist(normalized.promptIds);
  await ensureSkillIdsExist(normalized.skillIds);

  try {
    await db.transaction(async (tx) => {
      await replaceJoinRows({
        database: tx,
        deleteTable: contentAgents,
        deleteWhere: eq(contentAgents.contentItemId, normalized.contentId),
        insertTable: contentAgents,
        insertValues: normalized.agentIds.map((agentId) => ({
          contentItemId: normalized.contentId,
          agentId,
        })),
      });

      await replaceJoinRows({
        database: tx,
        deleteTable: contentPrompts,
        deleteWhere: eq(contentPrompts.contentItemId, normalized.contentId),
        insertTable: contentPrompts,
        insertValues: normalized.promptIds.map((promptId) => ({
          contentItemId: normalized.contentId,
          promptId,
        })),
      });

      await replaceJoinRows({
        database: tx,
        deleteTable: contentSkills,
        deleteWhere: eq(contentSkills.contentItemId, normalized.contentId),
        insertTable: contentSkills,
        insertValues: normalized.skillIds.map((skillId) => ({
          contentItemId: normalized.contentId,
          skillId,
        })),
      });

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "content",
        action: "replace_relations",
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
      kind: "content-relations" as const,
      contentId: normalized.contentId,
      agentIds: normalized.agentIds,
      promptIds: normalized.promptIds,
      skillIds: normalized.skillIds,
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
