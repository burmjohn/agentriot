export {
  createFileAgentRepository,
} from "./file-repository";
export {
  createDatabaseAgentRepository,
  createMemoryAgentRepository,
  type MemoryAgentRepository,
} from "./repository";
export {
  AgentServiceError,
  RESERVED_AGENT_SLUGS,
  createAgentService,
  createDefaultAgentService,
  type AgentService,
} from "./service";
export type {
  AgentKeyLookup,
  AgentRepository,
  AgentSoftwareSummary,
  AgentStatus,
  AgentUpdateSummary,
  ClaimAgentInput,
  ClaimAgentResult,
  PublicAgentProfile,
  RegisterAgentInput,
  RegisterAgentResult,
  StoredAgentKeyRecord,
  StoredAgentRecord,
  StoredClaimRecord,
  StoredSoftwareRecord,
} from "./types";

import { createDefaultAgentService } from "./service";

export async function getPublicAgentProfileBySlug(slug: string) {
  return createDefaultAgentService().getPublicAgentProfileBySlug(slug);
}
