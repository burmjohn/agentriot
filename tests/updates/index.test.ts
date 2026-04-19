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

  it("falls back to seed feed data when the database is unavailable", async () => {
    listGlobalFeedMock.mockRejectedValue(
      Object.assign(new Error("database agentriot_dev does not exist"), {
        code: "3D000",
      }),
    );
    getPublicAgentUpdateMock.mockResolvedValue(null);

    const { getPublicGlobalFeedPage } = await import("@/lib/updates");
    const page = await getPublicGlobalFeedPage(1, 4);

    expect(page.items.length).toBeGreaterThan(0);
    expect(page.items[0]).toMatchObject({
      agentSlug: "atlas-research-agent",
      signalType: "major_release",
    });
  });
});
