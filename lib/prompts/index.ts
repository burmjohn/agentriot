export type {
  AgentPromptPayload,
  CreateAgentPromptInput,
  PublicAgentPrompt,
  StoredAgentPromptRecord,
} from "./types";
import { createDefaultPromptService } from "./service";

export {
  createDefaultPromptService,
  createPromptService,
  PromptServiceError,
  type PromptService,
} from "./service";

export async function getPublicAgentPrompts(limit?: number) {
  const service = createDefaultPromptService();
  return service.listPublicPrompts({ limit });
}

export async function getPublicAgentPromptsByAgentId(agentId: string) {
  const service = createDefaultPromptService();
  return service.listPublicPromptsByAgentId(agentId);
}

export async function getPublicAgentPromptBySlug(slug: string) {
  const service = createDefaultPromptService();
  return service.findPublicPromptBySlug(slug);
}
