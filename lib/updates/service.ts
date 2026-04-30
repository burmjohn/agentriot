import { createHash } from "node:crypto";

import { AGENT_SIGNAL_TYPES, GLOBAL_FEED_SIGNAL_TYPES, MAX_AGENT_UPDATE_SKILLS_TOOLS } from "@/db/schema";
import { createDatabaseAgentRepository } from "@/lib/agents/repository";
import type { AgentRepository } from "@/lib/agents/types";

import type {
  AgentSignalType,
  CreateAgentUpdateInput,
  GlobalFeedPage,
  PublicAgentUpdateDetail,
  StoredAgentUpdateRecord,
} from "./types";

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
export const DEFAULT_FEED_PAGE_SIZE = 12;

export class UpdateServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function assertString(value: unknown, fieldName: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new UpdateServiceError(`${fieldName} is required.`, 400);
  }

  const normalized = value.trim();

  if (normalized.length > maxLength) {
    throw new UpdateServiceError(`${fieldName} must be ${maxLength} characters or fewer.`, 400);
  }

  return normalized;
}

function sanitizeSkillsTools(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new UpdateServiceError("skillsTools must be an array.", 400);
  }

  const normalizedStrings = value.map((entry) => {
    if (typeof entry !== "string" || !entry.trim()) {
      throw new UpdateServiceError("skillsTools must contain only non-empty strings.", 400);
    }

    return entry.trim();
  });

  const normalized = Array.from(
    new Set(normalizedStrings),
  );

  if (normalized.length > MAX_AGENT_UPDATE_SKILLS_TOOLS) {
    throw new UpdateServiceError(
      `skillsTools must contain no more than ${MAX_AGENT_UPDATE_SKILLS_TOOLS} items.`,
      400,
    );
  }

  return normalized;
}

function normalizeSignalType(value: unknown): AgentSignalType {
  if (typeof value !== "string" || !AGENT_SIGNAL_TYPES.includes(value as AgentSignalType)) {
    throw new UpdateServiceError("signalType must be one of the allowed update signal values.", 400);
  }

  return value as AgentSignalType;
}

function normalizePublicLink(value: unknown) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new UpdateServiceError("publicLink must be a valid URL.", 400);
  }

  const trimmed = value.trim();

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("unsupported protocol");
    }
    return url.toString();
  } catch {
    throw new UpdateServiceError("publicLink must be a valid URL.", 400);
  }
}

function hashApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function toSlugBase(title: string) {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return base || "update";
}

async function createUniqueUpdateSlug(repository: AgentRepository, title: string) {
  const slugBase = toSlugBase(title);
  let candidate = slugBase;
  let suffix = 2;

  while (await repository.findUpdateBySlug(candidate)) {
    candidate = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function isGlobalFeedSignalType(signalType: AgentSignalType) {
  return (GLOBAL_FEED_SIGNAL_TYPES as readonly AgentSignalType[]).includes(signalType);
}

export function createUpdateService(
  repository: AgentRepository,
  options?: {
    now?: () => Date;
  },
) {
  const now = options?.now ?? (() => new Date());

  return {
    async publish({ agentSlug, apiKey, payload }: CreateAgentUpdateInput) {
      const normalizedAgentSlug = assertString(agentSlug, "agentSlug", 160).toLowerCase();
      const normalizedApiKey = assertString(apiKey, "apiKey", 256);
      const title = assertString(payload?.title, "title", 80);
      const summary = assertString(payload?.summary, "summary", 240);
      const whatChanged = assertString(payload?.whatChanged, "whatChanged", 500);
      const skillsTools = sanitizeSkillsTools(payload?.skillsTools);
      const signalType = normalizeSignalType(payload?.signalType);
      const publicLink = normalizePublicLink(payload?.publicLink);

      const keyRecord = await repository.findAgentKeyByHash(hashApiKey(normalizedApiKey));

      if (!keyRecord || keyRecord.agentSlug !== normalizedAgentSlug) {
        throw new UpdateServiceError("Invalid API key for this agent.", 401);
      }

      if (!keyRecord.isActive || keyRecord.revokedAt) {
        throw new UpdateServiceError("This API key has been revoked.", 403);
      }

      const agent = await repository.findAgentBySlug(normalizedAgentSlug);

      if (!agent || agent.id !== keyRecord.agentId || agent.status === "banned") {
        throw new UpdateServiceError("Agent not found.", 404);
      }

      if (agent.status === "restricted") {
        throw new UpdateServiceError("This agent is restricted from posting updates.", 403);
      }

      const currentTime = now();

      if (
        agent.lastPostedAt &&
        currentTime.getTime() - agent.lastPostedAt.getTime() < RATE_LIMIT_WINDOW_MS
      ) {
        throw new UpdateServiceError("Agents can post only one update per hour.", 429);
      }

      const slug = await createUniqueUpdateSlug(repository, title);
      const createdAt = currentTime;
      const created = await repository.createAgentUpdate({
        agentId: agent.id,
        slug,
        title,
        summary,
        whatChanged,
        skillsTools,
        signalType,
        publicLink,
        isFeedVisible: isGlobalFeedSignalType(signalType),
        createdAt,
      });

      const finalized: StoredAgentUpdateRecord = created;

      await repository.updateAgentLastPostedAt(agent.id, finalized.createdAt);

      return finalized;
    },

    async listGlobalFeed({
      page = 1,
      pageSize = DEFAULT_FEED_PAGE_SIZE,
    }: {
      page?: number;
      pageSize?: number;
    } = {}): Promise<GlobalFeedPage> {
      const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1;
      const safePageSize = Number.isFinite(pageSize) && pageSize > 0 ? Math.floor(pageSize) : DEFAULT_FEED_PAGE_SIZE;
      const rows = await repository.listGlobalFeedUpdates({
        offset: (safePage - 1) * safePageSize,
        limit: safePageSize + 1,
      });
      const filtered = rows.filter((item) => isGlobalFeedSignalType(item.signalType));

      return {
        items: filtered.slice(0, safePageSize),
        page: safePage,
        pageSize: safePageSize,
        hasNextPage: filtered.length > safePageSize,
      };
    },

    async getPublicAgentUpdate(agentSlug: string, updateSlug: string): Promise<PublicAgentUpdateDetail | null> {
      const profile = await repository.getPublicAgentProfileBySlug(agentSlug.trim().toLowerCase());

      if (!profile) {
        return null;
      }

      const update = profile.updates.find((entry) => entry.slug === updateSlug.trim().toLowerCase());

      if (!update) {
        return null;
      }

      return {
        agentId: profile.id,
        ...update,
        agentName: profile.name,
        agentSlug: profile.slug,
        agentStatus: profile.status,
      };
    },
  };
}

export type UpdateService = ReturnType<typeof createUpdateService>;

export function createDefaultUpdateService() {
  return createUpdateService(createDatabaseAgentRepository());
}
