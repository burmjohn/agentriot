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
import { getSeedGlobalFeedPage, getSeedPublicAgentUpdate } from "./seed";

function shouldUseSeedFallback(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error
    ? String((error as { code?: unknown }).code)
    : typeof error === "object" && error !== null && "cause" in error && typeof (error as { cause?: unknown }).cause === "object" && (error as { cause?: { code?: unknown } }).cause !== null && "code" in (error as { cause?: { code?: unknown } }).cause!
      ? String((error as { cause?: { code?: unknown } }).cause?.code)
      : "";
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  return code === "3D000"
    || code === "ECONNREFUSED"
    || code === "ENOTFOUND"
    || message.includes("database")
    || message.includes("connect")
    || message.includes("econrefused")
    || message.includes("enotfound");
}

export const getPublicGlobalFeedPage = cache(async (page = 1, pageSize = DEFAULT_FEED_PAGE_SIZE) => {
  try {
    return await createDefaultUpdateService().listGlobalFeed({ page, pageSize });
  } catch (error) {
    if (shouldUseSeedFallback(error)) {
      return getSeedGlobalFeedPage(page, pageSize);
    }

    throw error;
  }
});

export const getPublicAgentUpdateBySlug = cache(async (agentSlug: string, updateSlug: string) => {
  try {
    return await createDefaultUpdateService().getPublicAgentUpdate(agentSlug, updateSlug);
  } catch (error) {
    if (shouldUseSeedFallback(error)) {
      return getSeedPublicAgentUpdate(agentSlug, updateSlug);
    }

    throw error;
  }
});
