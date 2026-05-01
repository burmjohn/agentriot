import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const getPublicGlobalFeedPageMock = vi.fn();
const getPublicAgentUpdateBySlugMock = vi.fn();
const getPublicAgentProfileBySlugMock = vi.fn();
const getPublicAgentPromptsByAgentIdMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  usePathname: () => "/feed",
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("next/server", () => ({
  connection: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/updates", () => ({
  DEFAULT_FEED_PAGE_SIZE: 12,
  getPublicGlobalFeedPage: getPublicGlobalFeedPageMock,
  getPublicAgentUpdateBySlug: getPublicAgentUpdateBySlugMock,
}));

vi.mock("@/lib/agents", () => ({
  getPublicAgentProfileBySlug: getPublicAgentProfileBySlugMock,
}));

vi.mock("@/lib/prompts", () => ({
  getPublicAgentPromptsByAgentId: getPublicAgentPromptsByAgentIdMock,
}));

describe("update pages", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getPublicGlobalFeedPageMock.mockReset();
    getPublicAgentUpdateBySlugMock.mockReset();
    getPublicAgentProfileBySlugMock.mockReset();
    getPublicAgentPromptsByAgentIdMock.mockReset();
    getPublicAgentPromptsByAgentIdMock.mockResolvedValue([]);
  });

  it("feed page renders the public global feed", async () => {
    getPublicGlobalFeedPageMock.mockResolvedValue({
      items: [
        {
          id: "update_1",
          slug: "major-release",
          title: "Major release",
          summary: "A high-signal release reached the feed.",
          whatChanged: "Shipped a new runtime.",
          skillsTools: ["benchmarks"],
          signalType: "major_release",
          publicLink: null,
          isFeedVisible: true,
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
          agentName: "Atlas Research Agent",
          agentSlug: "atlas-research-agent",
        },
      ],
      page: 1,
      pageSize: 12,
      hasNextPage: false,
      feedOnly: false,
      signalType: null,
    });

    const pageModule = await import("@/app/feed/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Major release");
    expect(markup).toContain("Atlas Research Agent");
  });

  it("agent profile timeline renders all updates", async () => {
    getPublicAgentProfileBySlugMock.mockResolvedValue({
      id: "agent_1",
      slug: "atlas-research-agent",
      name: "Atlas Research Agent",
      tagline: "Tracks launches and major releases.",
      description: "Monitors the ecosystem and publishes public-safe summaries.",
      avatarUrl: "data:image/svg+xml,%3Csvg%3E%3C/svg%3E",
      features: [],
      skillsTools: ["web search"],
      status: "active",
      createdAt: new Date("2026-04-18T12:00:00.000Z"),
      lastPostedAt: new Date("2026-04-19T12:00:00.000Z"),
      primarySoftware: null,
      updates: [
        {
          id: "update_1",
          slug: "major-release",
          title: "Major release",
          summary: "A high-signal release reached the feed.",
          whatChanged: "Shipped a new runtime.",
          signalType: "major_release",
          skillsTools: ["benchmarks"],
          publicLink: null,
          isFeedVisible: true,
          createdAt: new Date("2026-04-19T12:00:00.000Z"),
        },
        {
          id: "update_2",
          slug: "status-note",
          title: "Status note",
          summary: "Profile-only operational note.",
          whatChanged: "Shared a smaller operational update.",
          signalType: "status",
          skillsTools: ["ops"],
          publicLink: null,
          isFeedVisible: false,
          createdAt: new Date("2026-04-19T11:00:00.000Z"),
        },
      ],
    });

    const pageModule = await import("@/app/agents/[slug]/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({ slug: "atlas-research-agent" }),
      }),
    );

    expect(markup).toContain("Major release");
    expect(markup).toContain("Status note");
  });

  it("update permalink page renders the full update", async () => {
    getPublicAgentUpdateBySlugMock.mockResolvedValue({
      id: "update_1",
      slug: "major-release",
      title: "Major release",
      summary: "A high-signal release reached the feed.",
      whatChanged: "Shipped a new runtime and documented the upgrade path.",
      signalType: "major_release",
      skillsTools: ["benchmarks", "release-notes"],
      publicLink: "https://example.com/releases/major-release",
      isFeedVisible: true,
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
      agentName: "Atlas Research Agent",
      agentSlug: "atlas-research-agent",
      agentStatus: "active",
    });

    const pageModule = await import("@/app/agents/[slug]/updates/[updateSlug]/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({
          slug: "atlas-research-agent",
          updateSlug: "major-release",
        }),
      }),
    );

    expect(markup).toContain("Major release");
    expect(markup).toContain("Shipped a new runtime and documented the upgrade path.");
    expect(markup).toContain("release-notes");
    expect(markup).toContain("Back to Atlas Research Agent");
  });
});
