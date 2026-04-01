import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  agentPrompts,
  agents,
  ingestionEvents,
  prompts,
  skillPrompts,
  skills,
} from "@/db/schema";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

export type PromptRelationsPayload = {
  promptId: string;
  agentIds: string[];
  skillIds: string[];
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedPayloadKeys = new Set(["promptId", "agentIds", "skillIds"]);

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
    `Unexpected prompt relation fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
}

function normalizeIdArray(value: unknown, fieldName: "agentIds" | "skillIds") {
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

function normalizePayload(payload: PromptRelationsPayload) {
  if (typeof payload.promptId !== "string" || payload.promptId.trim().length === 0) {
    throw createKnownError("promptId is required.", 400, "invalid_payload");
  }

  return {
    promptId: payload.promptId.trim(),
    agentIds: normalizeIdArray(payload.agentIds, "agentIds"),
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
  normalized: { promptId: string; agentIds: string[]; skillIds: string[] };
}) {
  if (existingEvent.payloadHash !== payloadHash) {
    throw createKnownError(
      "Payload differs from the original idempotent request.",
      409,
      "idempotency_conflict",
    );
  }

  if (existingEvent.createdRecordId !== normalized.promptId) {
    throw createKnownError(
      "Idempotent prompt relations target could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "prompt-relations" as const,
    promptId: normalized.promptId,
    agentIds: normalized.agentIds,
    skillIds: normalized.skillIds,
    replayed: true,
  };
}

async function ensurePromptExists(promptId: string) {
  const [prompt] = await db
    .select({ id: prompts.id })
    .from(prompts)
    .where(eq(prompts.id, promptId))
    .limit(1);

  if (prompt) {
    return;
  }

  throw createKnownError("Prompt record could not be found.", 404, "prompt_not_found");
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

export async function assignPromptRelations({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: PromptRelationsPayload;
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

  await ensurePromptExists(normalized.promptId);
  await ensureAgentIdsExist(normalized.agentIds);
  await ensureSkillIdsExist(normalized.skillIds);

  try {
    await db.transaction(async (tx) => {
      await replaceJoinRows({
        database: tx,
        deleteTable: agentPrompts,
        deleteWhere: eq(agentPrompts.promptId, normalized.promptId),
        insertTable: agentPrompts,
        insertValues: normalized.agentIds.map((agentId) => ({
          agentId,
          promptId: normalized.promptId,
        })),
      });

      await replaceJoinRows({
        database: tx,
        deleteTable: skillPrompts,
        deleteWhere: eq(skillPrompts.promptId, normalized.promptId),
        insertTable: skillPrompts,
        insertValues: normalized.skillIds.map((skillId) => ({
          skillId,
          promptId: normalized.promptId,
        })),
      });

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "prompt",
        action: "replace_relations",
        idempotencyKey,
        externalId: null,
        payload: normalized,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: normalized.promptId,
      });
    });

    return {
      kind: "prompt-relations" as const,
      promptId: normalized.promptId,
      agentIds: normalized.agentIds,
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
