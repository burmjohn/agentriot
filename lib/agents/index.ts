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
  PublicAgentDirectoryEntry,
  PublicAgentProfile,
  RegisterAgentInput,
  RegisterAgentResult,
  StoredAgentKeyRecord,
  StoredAgentRecord,
  StoredClaimRecord,
  StoredSoftwareRecord,
} from "./types";

import { createDefaultAgentService } from "./service";
import { createDatabaseAgentRepository } from "./repository";

export async function getPublicAgentProfileBySlug(slug: string) {
  return createDefaultAgentService().getPublicAgentProfileBySlug(slug);
}

export async function getPublicAgentProfiles() {
  return createDatabaseAgentRepository().listPublicAgentProfiles();
}
