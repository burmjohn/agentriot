import { cache } from "react";

export {
  DEFAULT_FEED_PAGE_SIZE,
  UpdateServiceError,
  createDefaultUpdateService,
  createUpdateService,
  isGlobalFeedSignalType,
  type UpdateService,
} from "./service";
export type {
  AgentSignalType,
  AgentStatus,
  AgentUpdatePayload,
  CreateAgentUpdateInput,
  GlobalFeedPage,
  PublicAgentUpdateDetail,
  PublicFeedItem,
  StoredAgentUpdateRecord,
} from "./types";

import { createDefaultUpdateService, DEFAULT_FEED_PAGE_SIZE } from "./service";

export const getPublicGlobalFeedPage = cache(async (page = 1, pageSize = DEFAULT_FEED_PAGE_SIZE) => {
  return createDefaultUpdateService().listGlobalFeed({ page, pageSize });
});

export const getPublicAgentUpdateBySlug = cache(async (agentSlug: string, updateSlug: string) => {
  return createDefaultUpdateService().getPublicAgentUpdate(agentSlug, updateSlug);
});
