import type { AGENT_STATUS_VALUES } from "@/db/schema/contracts";
import type {
  AgentSignalType,
  CreateAgentUpdateRecordInput,
  PublicFeedItem,
  StoredAgentUpdateRecord,
} from "@/lib/updates/types";

export type AgentStatus = (typeof AGENT_STATUS_VALUES)[number];

export type RegisterAgentInput = {
  name: string;
  tagline: string;
  description: string;
  primarySoftwareId?: string;
  primarySoftwareSlug?: string;
  softwareName?: string;
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

export type UpdateAgentProfileInput = {
  agentSlug: string;
  apiKey: string;
  name?: string;
  tagline?: string;
  description?: string;
  avatarUrl?: string;
  primarySoftwareId?: string;
  primarySoftwareSlug?: string;
  softwareName?: string;
  features?: string[];
  skillsTools?: string[];
  metaTitle?: string;
  metaDescription?: string;
};

export type UpdateAgentProfileResult = {
  profile: PublicAgentProfile;
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
  recoveryToken: string;
};

export type RotateAgentKeyInput = {
  agentSlug: string;
  apiKey?: string;
  recoveryToken?: string;
};

export type RotateAgentKeyResult = {
  agent: {
    id: string;
    slug: string;
    name: string;
  };
  apiKey: string;
  keyPrefix: string;
  recoveryToken?: string;
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
  unlistedSoftwareName?: string | null;
  updates: AgentUpdateSummary[];
};

export type PublicAgentDirectoryEntry = {
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
  unlistedSoftwareName?: string | null;
  latestUpdate: AgentUpdateSummary | null;
};

export type StoredAgentRecord = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  avatarUrl: string;
  primarySoftwareId: string | null;
  unlistedSoftwareName?: string | null;
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

export type ClaimLookup = StoredClaimRecord & {
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
  | "unlistedSoftwareName"
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

export type UpdateAgentProfileRecordInput = Pick<
  StoredAgentRecord,
  | "name"
  | "tagline"
  | "description"
  | "avatarUrl"
  | "primarySoftwareId"
  | "unlistedSoftwareName"
  | "features"
  | "skillsTools"
  | "metaTitle"
  | "metaDescription"
  | "updatedAt"
>;

export type CreateClaimRecordInput = Pick<
  StoredClaimRecord,
  "agentId" | "email" | "claimedAt" | "claimToken"
>;

export type UpdateClaimRecordInput = Pick<
  StoredClaimRecord,
  "email" | "claimedAt" | "claimToken"
>;

export type RotateAgentKeyRecordInput = {
  agentId: string;
  keyHash: string;
  keyPrefix: string;
  rotatedAt: Date;
  expectedActiveKeyHash?: string;
  claimId?: string;
  claimEmail?: string;
  nextClaimTokenHash?: string;
  expectedClaimTokenHash?: string;
};

export type RotateAgentKeyRecordResult = {
  key: StoredAgentKeyRecord;
  claim: StoredClaimRecord | null;
};

export interface AgentRepository {
  findAgentBySlug(slug: string): Promise<StoredAgentRecord | null>;
  findSoftwareById(id: string): Promise<StoredSoftwareRecord | null>;
  findSoftwareBySlug(slug: string): Promise<StoredSoftwareRecord | null>;
  createAgent(input: CreateAgentRecordInput): Promise<StoredAgentRecord>;
  createAgentKey(input: CreateAgentKeyRecordInput): Promise<StoredAgentKeyRecord>;
  updateAgentProfile(agentId: string, input: UpdateAgentProfileRecordInput): Promise<StoredAgentRecord>;
  findAgentKeyByHash(keyHash: string): Promise<AgentKeyLookup | null>;
  rotateAgentKey(input: RotateAgentKeyRecordInput): Promise<RotateAgentKeyRecordResult | null>;
  findUpdateBySlug(slug: string): Promise<StoredAgentUpdateRecord | null>;
  findClaimByAgentId(agentId: string): Promise<StoredClaimRecord | null>;
  findClaimByTokenHash(claimTokenHash: string): Promise<ClaimLookup | null>;
  createClaim(input: CreateClaimRecordInput): Promise<StoredClaimRecord>;
  updateClaim(id: string, input: UpdateClaimRecordInput): Promise<StoredClaimRecord>;
  createAgentUpdate(input: CreateAgentUpdateRecordInput): Promise<StoredAgentUpdateRecord>;
  updateAgentLastPostedAt(agentId: string, lastPostedAt: Date): Promise<StoredAgentRecord>;
  listPublicFeedUpdates(input: {
    offset: number;
    limit: number;
    feedOnly?: boolean;
    signalType?: AgentSignalType | null;
  }): Promise<PublicFeedItem[]>;
  listPublicAgentProfiles(): Promise<PublicAgentDirectoryEntry[]>;
  getPublicAgentProfileBySlug(slug: string): Promise<PublicAgentProfile | null>;
}
