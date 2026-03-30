import { and, eq } from "drizzle-orm";
import { createHash } from "node:crypto";
import { db } from "@/db";
import { agents, ingestionEvents } from "@/db/schema";
import { ensureUniqueAgentSlug } from "@/lib/admin/cms";
import { normalizeAgentInput } from "@/lib/admin/record-input";

export type AgentIngestionPayload = {
  title: string;
  slug?: string | null;
  status: string;
  shortDescription?: string | null;
  longDescription?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  pricingNotes?: string | null;
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
      "Idempotent agent record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  const [existingAgent] = await db
    .select({
      id: agents.id,
      slug: agents.slug,
      status: agents.status,
    })
    .from(agents)
    .where(eq(agents.id, existingEvent.createdRecordId))
    .limit(1);

  if (!existingAgent) {
    throw createKnownError(
      "Idempotent agent record could not be found.",
      409,
      "idempotency_missing_record",
    );
  }

  return {
    kind: "agent" as const,
    id: existingAgent.id,
    slug: existingAgent.slug,
    status: existingAgent.status,
    replayed: true,
  };
}

export async function ingestAgentRecord({
  apiKeyId,
  idempotencyKey,
  payload,
}: {
  apiKeyId: string;
  idempotencyKey: string;
  payload: AgentIngestionPayload;
}) {
  const normalized = normalizeAgentInput(payload);
  const payloadHash = buildPayloadHash({
    title: normalized.title,
    slug: normalized.slug,
    status: normalized.status,
    shortDescription: normalized.shortDescription,
    longDescription: normalized.longDescription,
    websiteUrl: normalized.websiteUrl,
    githubUrl: normalized.githubUrl,
    pricingNotes: normalized.pricingNotes,
    externalId: payload.externalId ?? null,
  });

  const existingEvent = await findExistingIngestionEvent(apiKeyId, idempotencyKey);

  if (existingEvent) {
    return buildReplayResult({
      existingEvent,
      payloadHash,
    });
  }

  const slug = await ensureUniqueAgentSlug(normalized.slug);

  try {
    const created = await db.transaction(async (tx) => {
      const [agent] = await tx
        .insert(agents)
        .values({
          ...normalized,
          slug,
          createdById: null,
          updatedById: null,
        })
        .returning();

      await tx.insert(ingestionEvents).values({
        apiKeyId,
        target: "agent",
        action: "create",
        idempotencyKey,
        externalId: payload.externalId ?? null,
        payload,
        payloadHash,
        status: "applied",
        processedAt: new Date(),
        createdRecordId: agent.id,
      });

      return agent;
    });

    return {
      kind: "agent" as const,
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
