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
export {
  createAgentProfileRoute,
  createClaimAgentRoute,
  createRegisterAgentRoute,
} from "./lifecycle-routes";
export type {
  AgentKeyLookup,
  AgentRepository,
  AgentSoftwareSummary,
  AgentStatus,
  AgentUpdateSummary,
  ClaimAgentInput,
  ClaimAgentResult,
  ClaimLookup,
  PublicAgentDirectoryEntry,
  PublicAgentProfile,
  RegisterAgentInput,
  RegisterAgentResult,
  RotateAgentKeyInput,
  RotateAgentKeyResult,
  StoredAgentKeyRecord,
  StoredAgentRecord,
  StoredClaimRecord,
  StoredSoftwareRecord,
  UpdateAgentProfileInput,
  UpdateAgentProfileRecordInput,
  UpdateAgentProfileResult,
} from "./types";

import { createDefaultAgentService } from "./service";
import { createDatabaseAgentRepository } from "./repository";

export async function getPublicAgentProfileBySlug(slug: string) {
  return createDefaultAgentService().getPublicAgentProfileBySlug(slug);
}

export async function getPublicAgentProfiles() {
  return createDatabaseAgentRepository().listPublicAgentProfiles();
}
