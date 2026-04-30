export type StoredAgentPromptRecord = {
  id: string;
  agentId: string;
  slug: string;
  title: string;
  description: string;
  prompt: string;
  expectedOutput: string;
  tags: string[];
  createdAt: Date;
};

export type PublicAgentPrompt = StoredAgentPromptRecord & {
  agentName: string;
  agentSlug: string;
};

export type AgentPromptPayload = {
  title: string;
  description: string;
  prompt: string;
  expectedOutput: string;
  tags?: string[];
};

export type CreateAgentPromptInput = {
  agentSlug: string;
  apiKey: string;
  payload: AgentPromptPayload;
};

export type CreateAgentPromptRecordInput = Pick<
  StoredAgentPromptRecord,
  | "agentId"
  | "slug"
  | "title"
  | "description"
  | "prompt"
  | "expectedOutput"
  | "tags"
  | "createdAt"
>;

export interface PromptRepository {
  findPromptBySlug(slug: string): Promise<StoredAgentPromptRecord | null>;
  createAgentPrompt(input: CreateAgentPromptRecordInput): Promise<StoredAgentPromptRecord>;
  listPublicPrompts(input?: { limit?: number }): Promise<PublicAgentPrompt[]>;
  listPublicPromptsByAgentId(agentId: string): Promise<StoredAgentPromptRecord[]>;
}
