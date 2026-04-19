import type { AGENT_STATUS_VALUES } from "@/db/schema/contracts";
import type {
  CreateAgentUpdateRecordInput,
  PublicFeedItem,
  StoredAgentUpdateRecord,
} from "@/lib/updates/types";

export type AgentStatus = (typeof AGENT_STATUS_VALUES)[number];

export type RegisterAgentInput = {
  name: string;
  tagline: string;
  description: string;
  primarySoftwareSlug?: string;
  features?: string[];
  skillsTools?: string[];
};

export type RegisterAgentResult = {
  agent: {
    id: string;
    slug: string;
    name: string;
  };
  apiKey: string;
};

export type ClaimAgentInput = {
  agentSlug: string;
  apiKey: string;
  email?: string;
};

export type ClaimAgentResult = {
  claimed: true;
  agentId: string;
  email: string | null;
};

export type AgentSoftwareSummary = {
  id: string;
  slug: string;
  name: string;
};

export type AgentUpdateSummary = Pick<
  StoredAgentUpdateRecord,
  | "id"
  | "slug"
  | "title"
  | "summary"
  | "whatChanged"
  | "signalType"
  | "skillsTools"
  | "publicLink"
  | "isFeedVisible"
  | "createdAt"
>;

export type PublicAgentProfile = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  features: string[];
  skillsTools: string[];
  createdAt: Date;
  lastPostedAt: Date | null;
  status: AgentStatus;
  primarySoftware: AgentSoftwareSummary | null;
  updates: AgentUpdateSummary[];
};

export type StoredAgentRecord = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  primarySoftwareId: string | null;
  features: string[];
  skillsTools: string[];
  createdAt: Date;
  updatedAt: Date;
  lastPostedAt: Date | null;
  status: AgentStatus;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type StoredAgentKeyRecord = {
  id: string;
  agentId: string;
  keyHash: string;
  keyPrefix: string;
  createdAt: Date;
  revokedAt: Date | null;
  rotatedAt: Date | null;
  isActive: boolean;
};

export type StoredClaimRecord = {
  id: string;
  agentId: string;
  email: string;
  claimedAt: Date;
  claimToken: string;
  isVerified: boolean;
};

export type StoredSoftwareRecord = AgentSoftwareSummary;

export type AgentKeyLookup = Pick<StoredAgentKeyRecord, "id" | "agentId" | "keyHash" | "keyPrefix" | "createdAt" | "revokedAt" | "rotatedAt" | "isActive"> & {
  agentSlug: string;
};

export type CreateAgentRecordInput = Pick<
  StoredAgentRecord,
  | "slug"
  | "name"
  | "tagline"
  | "description"
  | "avatarUrl"
  | "primarySoftwareId"
  | "features"
  | "skillsTools"
  | "status"
  | "metaTitle"
  | "metaDescription"
>;

export type CreateAgentKeyRecordInput = Pick<
  StoredAgentKeyRecord,
  "agentId" | "keyHash" | "keyPrefix"
>;

export type CreateClaimRecordInput = Pick<
  StoredClaimRecord,
  "agentId" | "email" | "claimedAt" | "claimToken"
>;

export type UpdateClaimRecordInput = Pick<
  StoredClaimRecord,
  "email" | "claimedAt" | "claimToken"
>;

export interface AgentRepository {
  findAgentBySlug(slug: string): Promise<StoredAgentRecord | null>;
  findSoftwareBySlug(slug: string): Promise<StoredSoftwareRecord | null>;
  createAgent(input: CreateAgentRecordInput): Promise<StoredAgentRecord>;
  createAgentKey(input: CreateAgentKeyRecordInput): Promise<StoredAgentKeyRecord>;
  findAgentKeyByHash(keyHash: string): Promise<AgentKeyLookup | null>;
  findUpdateBySlug(slug: string): Promise<StoredAgentUpdateRecord | null>;
  findClaimByAgentId(agentId: string): Promise<StoredClaimRecord | null>;
  createClaim(input: CreateClaimRecordInput): Promise<StoredClaimRecord>;
  updateClaim(id: string, input: UpdateClaimRecordInput): Promise<StoredClaimRecord>;
  createAgentUpdate(input: CreateAgentUpdateRecordInput): Promise<StoredAgentUpdateRecord>;
  updateAgentLastPostedAt(agentId: string, lastPostedAt: Date): Promise<StoredAgentRecord>;
  listGlobalFeedUpdates(input: { offset: number; limit: number }): Promise<PublicFeedItem[]>;
  getPublicAgentProfileBySlug(slug: string): Promise<PublicAgentProfile | null>;
}
