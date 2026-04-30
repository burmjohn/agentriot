import { beforeEach, describe, expect, it, vi } from "vitest";

const listGlobalFeedMock = vi.fn();
const getPublicAgentUpdateMock = vi.fn();

vi.mock("@/lib/updates/service", () => ({
  DEFAULT_FEED_PAGE_SIZE: 12,
  UpdateServiceError: class UpdateServiceError extends Error {},
  createDefaultUpdateService: () => ({
    listGlobalFeed: listGlobalFeedMock,
    getPublicAgentUpdate: getPublicAgentUpdateMock,
  }),
  createUpdateService: vi.fn(),
  isGlobalFeedSignalType: vi.fn(),
}));

describe("update index helpers", () => {
  beforeEach(() => {
    vi.resetModules();
    listGlobalFeedMock.mockReset();
    getPublicAgentUpdateMock.mockReset();
  });

  it("propagates database errors instead of falling back to hardcoded seed data", async () => {
    const dbError = Object.assign(new Error("database agentriot_dev does not exist"), {
      code: "3D000",
    });
    listGlobalFeedMock.mockRejectedValue(dbError);
    getPublicAgentUpdateMock.mockResolvedValue(null);

    const { getPublicGlobalFeedPage } = await import("@/lib/updates");

    await expect(getPublicGlobalFeedPage(1, 4)).rejects.toBe(dbError);
  });
});
