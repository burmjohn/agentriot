import { and, eq, inArray } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import {
  agentPrompts,
  agentSkills,
  agents,
  ingestionEvents,
  prompts,
  skills,
} from "@/db/schema";
import { replaceJoinRows } from "@/lib/admin/relation-writes";

export type AgentRelationsPayload = {
  agentId: string;
  promptIds: string[];
  skillIds: string[];
};

type IngestionLookup = {
  id: string;
  payloadHash: string;
  createdRecordId: string | null;
  status: string;
};

const allowedPayloadKeys = new Set(["agentId", "promptIds", "skillIds"]);

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
    `Unexpected agent relation fields: ${unknownFields.join(", ")}.`,
    400,
    "invalid_payload",
  );
}

function normalizeIdArray(value: unknown, fieldName: "promptIds" | "skillIds") {
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

function normalizePayload(payload: AgentRelationsPayload) {
  if (typeof payload.agentId !== "string" || payload.agentId.trim().length === 0) {
    throw createKnownError("agentId is required.", 400, "invalid_payload");
  }

  return {
    agentId: payload.agentId.trim(),
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
  normalized: { agentId: string; promptIds: string[]; skillIds: string[] };
}) {
  if (existingEvent.payloadHash !== payloadHash) {
    throw createKnownError(
      "Payload differs from the original idempotent request.",
      409,
      "idempotency_conflict",
    );
  }

  if (existingEvent.createdRecordId !== normalized.agentId) {
    throw createKnownError(
      "Idempotent agent relations target could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "agent-relations" as const,
    agentId: normalized.agentId,
    promptIds: normalized.promptIds,
    skillIds: normalized.skillIds,
    replayed: true,
  };
}

async function ensureAgentExists(agentId: string) {
  const [agent] = await db
    .select({ id: agents.id })
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (agent) {
    return;
  }

  throw createKnownError("Agent record could not be found.", 404, "agent_not_found");
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

export async function assignAgentRelations({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: AgentRelationsPayload;
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

  await ensureAgentExists(normalized.agentId);
  await ensurePromptIdsExist(normalized.promptIds);
  await ensureSkillIdsExist(normalized.skillIds);

  try {
    await db.transaction(async (tx) => {
      await replaceJoinRows({
        database: tx,
        deleteTable: agentPrompts,
        deleteWhere: eq(agentPrompts.agentId, normalized.agentId),
        insertTable: agentPrompts,
        insertValues: normalized.promptIds.map((promptId) => ({
          agentId: normalized.agentId,
          promptId,
        })),
      });

      await replaceJoinRows({
        database: tx,
        deleteTable: agentSkills,
        deleteWhere: eq(agentSkills.agentId, normalized.agentId),
        insertTable: agentSkills,
        insertValues: normalized.skillIds.map((skillId) => ({
          agentId: normalized.agentId,
          skillId,
        })),
      });

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "agent",
        action: "replace_relations",
        idempotencyKey,
        externalId: null,
        payload: normalized,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: normalized.agentId,
      });
    });

    return {
      kind: "agent-relations" as const,
      agentId: normalized.agentId,
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
