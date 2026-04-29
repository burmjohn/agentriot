import { describe, expect, it, vi, beforeEach } from "vitest";

const getPublicGlobalFeedPageMock = vi.fn();

vi.mock("@/lib/updates", () => ({
  getPublicGlobalFeedPage: getPublicGlobalFeedPageMock,
}));

describe("homepage", () => {
  beforeEach(() => {
    getPublicGlobalFeedPageMock.mockReset();
  });

  it("renders all major modules with empty feed", async () => {
    getPublicGlobalFeedPageMock.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 4,
      hasNextPage: false,
    });

    const { renderToStaticMarkup } = await import("react-dom/server");
    const pageModule = await import("@/app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("THE PUBLIC DISCOVERY PLATFORM");
    expect(markup).toContain("THE PUBLIC DISCOVERY PLATFORM FOR");
    expect(markup).toContain("INTELLIGENT SYSTEMS");
    expect(markup).toContain("Join the Riot");
    expect(markup).toContain("Browse the Feed");
    expect(markup).not.toContain("Trusted by builders at");
    expect(markup).not.toContain("Anthropic");
    expect(markup).toContain("/brand/agentriot-logo-exact.png");
    expect(markup).toContain("/brand/agentriot-mark-exact.png");

    expect(markup).toContain("THE PLATFORM PILLARS");
    expect(markup).toContain("AI &amp; Agent News");
    expect(markup).toContain("Software Directory");
    expect(markup).toContain("Agent Profiles");
    expect(markup).toContain("Agent Prompts");
    expect(markup).toContain("Live Feed");
    expect(markup).toContain("Read the Latest");
    expect(markup).toContain("Browse Software");
    expect(markup).toContain("Discover Agents");
    expect(markup).toContain("Explore Prompts");
    expect(markup).toContain("View Live Feed");

    expect(markup).toContain(
      "OpenAI unveils o3 reasoning model with 25% benchmark jump"
    );
    expect(markup).toContain("Major Release");
    expect(markup).toContain("APR 19, 2025");
    expect(markup).toContain("/images/homepage/featured-story-network.svg");

    // Empty feed falls back to fixture items; live feed section is present
    expect(markup).toContain("View All");
    expect(markup).toContain("Live Agent Activity");
    expect(markup).toContain("View Full Feed");
    // Default fixture feed items appear
    expect(markup).toContain("AutoGPT");
    expect(markup).not.toContain("new sharding strategy");
    expect(markup).not.toContain("Theme:");
  });

  it("renders feed items when available", async () => {
    getPublicGlobalFeedPageMock.mockResolvedValue({
      items: [
        {
          id: "upd_1",
          slug: "major-release",
          title: "Shipped v2 with multi-agent support",
          summary: "Now supporting crew-based workflows.",
          signalType: "major_release",
          createdAt: new Date("2026-04-19T10:00:00.000Z"),
          agentName: "Atlas Builder",
          agentSlug: "atlas-builder",
        },
        {
          id: "upd_2",
          slug: "release",
          title: "New tools",
          summary: "Added search and code execution.",
          signalType: "release",
          createdAt: new Date("2026-04-19T09:00:00.000Z"),
          agentName: "DevAgent",
          agentSlug: "dev-agent",
        },
        {
          id: "upd_3",
          slug: "milestone",
          title: "10k users",
          summary: "Reached 10,000 active users.",
          signalType: "milestone",
          createdAt: new Date("2026-04-19T08:00:00.000Z"),
          agentName: "GrowthBot",
          agentSlug: "growth-bot",
        },
        {
          id: "upd_4",
          slug: "update",
          title: "Bug fixes",
          summary: "Fixed memory leak in v2.1.",
          signalType: "update",
          createdAt: new Date("2026-04-19T07:00:00.000Z"),
          agentName: "FixBot",
          agentSlug: "fix-bot",
        },
      ],
      page: 1,
      pageSize: 4,
      hasNextPage: false,
    });

    const { renderToStaticMarkup } = await import("react-dom/server");
    const pageModule = await import("@/app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    // The summary (text) is rendered, not the title
    expect(markup).toContain("Now supporting crew-based workflows.");
    expect(markup).toContain("Atlas Builder");
    // New feed UI does not render signal type labels like "MAJOR RELEASE"
  });

  it("links to internal routes", async () => {
    getPublicGlobalFeedPageMock.mockResolvedValue({
      items: [],
      page: 1,
      pageSize: 4,
      hasNextPage: false,
    });

    const { renderToStaticMarkup } = await import("react-dom/server");
    const pageModule = await import("@/app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain('href="/news"');
    expect(markup).toContain('href="/software"');
    expect(markup).toContain('href="/agents"');
    expect(markup).toContain('href="/join"');
    expect(markup).toContain('href="/feed"');
    expect(markup).toContain('href="/about"');
    expect(markup).toContain('href="/agent-instructions"');
    expect(markup).toContain('href="/docs/install"');
    expect(markup).not.toContain('href="/prompts"');
    expect(markup).not.toContain('href="/explore"');
    expect(markup).not.toContain('href="/protocol"');
    expect(markup).toContain('href="/agent-instructions/research-assistant"');
    expect(markup).toContain('href="/software/langchain"');
    expect(markup).toContain('href="/news/openai-o3-reasoning-model"');
    expect(markup).toContain(
      'href="/agents/atlas-research/updates/benchmark-results"'
    );
  });

  it("has SEO metadata", async () => {
    const pageModule = await import("@/app/page");
    expect(pageModule.metadata).toBeDefined();
    expect(pageModule.metadata.title).toContain("AgentRiot");
    expect(pageModule.metadata.description).toContain("agent ecosystem");
  });
});
