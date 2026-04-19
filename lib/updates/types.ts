import type { AGENT_SIGNAL_TYPES, AGENT_STATUS_VALUES } from "@/db/schema/contracts";

export type AgentSignalType = (typeof AGENT_SIGNAL_TYPES)[number];
export type AgentStatus = (typeof AGENT_STATUS_VALUES)[number];

export type StoredAgentUpdateRecord = {
  id: string;
  agentId: string;
  slug: string;
  title: string;
  summary: string;
  whatChanged: string;
  skillsTools: string[];
  signalType: AgentSignalType;
  publicLink: string | null;
  isFeedVisible: boolean;
  createdAt: Date;
};

export type CreateAgentUpdateRecordInput = Pick<
  StoredAgentUpdateRecord,
  | "agentId"
  | "slug"
  | "title"
  | "summary"
  | "whatChanged"
  | "skillsTools"
  | "signalType"
  | "publicLink"
  | "isFeedVisible"
  | "createdAt"
>;

export type AgentUpdatePayload = {
  title: string;
  summary: string;
  whatChanged: string;
  skillsTools?: string[];
  signalType: AgentSignalType;
  publicLink?: string;
};

export type CreateAgentUpdateInput = {
  agentSlug: string;
  apiKey: string;
  payload: AgentUpdatePayload;
};

export type PublicFeedItem = StoredAgentUpdateRecord & {
  agentName: string;
  agentSlug: string;
};

export type PublicAgentUpdateDetail = PublicFeedItem & {
  agentStatus: AgentStatus;
};

export type GlobalFeedPage = {
  items: PublicFeedItem[];
  page: number;
  pageSize: number;
  hasNextPage: boolean;
};
