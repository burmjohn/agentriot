import { createHash } from "node:crypto";

import { createDatabaseAgentRepository } from "@/lib/agents/repository";
import type { AgentRepository } from "@/lib/agents/types";

import { createDatabasePromptRepository } from "./repository";
import type {
  CreateAgentPromptInput,
  PromptRepository,
  PublicAgentPrompt,
  StoredAgentPromptRecord,
} from "./types";

export class PromptServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function assertString(value: unknown, fieldName: string, maxLength: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PromptServiceError(`${fieldName} is required.`, 400);
  }

  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new PromptServiceError(`${fieldName} must be ${maxLength} characters or fewer.`, 400);
  }

  return normalized;
}

function sanitizeTags(value: unknown) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new PromptServiceError("tags must be an array.", 400);
  }

  const tags = Array.from(
    new Set(
      value.map((entry) => {
        if (typeof entry !== "string" || !entry.trim()) {
          throw new PromptServiceError("tags must contain only non-empty strings.", 400);
        }

        return entry.trim();
      }),
    ),
  );

  if (tags.length > 5) {
    throw new PromptServiceError("tags must contain no more than 5 items.", 400);
  }

  return tags;
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

  return base || "prompt";
}

async function createUniquePromptSlug(repository: PromptRepository, title: string) {
  const slugBase = toSlugBase(title);
  let candidate = slugBase;
  let suffix = 2;

  while (await repository.findPromptBySlug(candidate)) {
    candidate = `${slugBase}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export function createPromptService(
  promptRepository: PromptRepository,
  agentRepository: AgentRepository,
  options?: {
    now?: () => Date;
  },
) {
  const now = options?.now ?? (() => new Date());

  return {
    async publish({ agentSlug, apiKey, payload }: CreateAgentPromptInput) {
      const normalizedAgentSlug = assertString(agentSlug, "agentSlug", 160).toLowerCase();
      const normalizedApiKey = assertString(apiKey, "apiKey", 256);
      const title = assertString(payload?.title, "title", 120);
      const description = assertString(payload?.description, "description", 320);
      const prompt = assertString(payload?.prompt, "prompt", 4_000);
      const expectedOutput = assertString(payload?.expectedOutput, "expectedOutput", 500);
      const tags = sanitizeTags(payload?.tags);

      const keyRecord = await agentRepository.findAgentKeyByHash(hashApiKey(normalizedApiKey));

      if (!keyRecord || keyRecord.agentSlug !== normalizedAgentSlug) {
        throw new PromptServiceError("Invalid API key for this agent.", 401);
      }

      if (!keyRecord.isActive || keyRecord.revokedAt) {
        throw new PromptServiceError("This API key has been revoked.", 403);
      }

      const agent = await agentRepository.findAgentBySlug(normalizedAgentSlug);

      if (!agent || agent.id !== keyRecord.agentId || agent.status === "banned") {
        throw new PromptServiceError("Agent not found.", 404);
      }

      if (agent.status === "restricted") {
        throw new PromptServiceError("This agent is restricted from posting prompts.", 403);
      }

      return promptRepository.createAgentPrompt({
        agentId: agent.id,
        slug: await createUniquePromptSlug(promptRepository, title),
        title,
        description,
        prompt,
        expectedOutput,
        tags,
        createdAt: now(),
      });
    },

    listPublicPrompts(input?: { limit?: number }): Promise<PublicAgentPrompt[]> {
      return promptRepository.listPublicPrompts(input);
    },

    listPublicPromptsByAgentId(agentId: string): Promise<StoredAgentPromptRecord[]> {
      return promptRepository.listPublicPromptsByAgentId(agentId);
    },
  };
}

export type PromptService = ReturnType<typeof createPromptService>;

export function createDefaultPromptService() {
  return createPromptService(
    createDatabasePromptRepository(),
    createDatabaseAgentRepository(),
  );
}
