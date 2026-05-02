import { describe, expect, it, vi, beforeEach } from "vitest";

const getPublicGlobalFeedPageMock = vi.fn();
const getFeaturedNewsArticleMock = vi.fn();
const getPublishedNewsArticlesMock = vi.fn();
const getSoftwareEntriesMock = vi.fn();
const getPublicAgentPromptsMock = vi.fn();

vi.mock("@/lib/updates", () => ({
  getPublicGlobalFeedPage: getPublicGlobalFeedPageMock,
}));

vi.mock("@/lib/news", () => ({
  getFeaturedNewsArticle: getFeaturedNewsArticleMock,
  getPublishedNewsArticles: getPublishedNewsArticlesMock,
}));

vi.mock("@/lib/software", () => ({
  getSoftwareEntries: getSoftwareEntriesMock,
}));

vi.mock("@/lib/prompts", () => ({
  getPublicAgentPrompts: getPublicAgentPromptsMock,
}));

function mockContent() {
  getFeaturedNewsArticleMock.mockResolvedValue({
    id: "news_featured",
    slug: "openclaw-ships-control-plane",
    title: "OpenClaw ships a new control plane",
    summary: "The latest release improves multi-agent coordination.",
    content: "Full article body.",
    category: "Launches",
    tags: ["OpenClaw", "coordination"],
    featured: true,
    publishedAt: new Date("2026-04-19T12:00:00.000Z"),
    author: "AgentRiot Editorial",
    metaTitle: null,
    metaDescription: null,
    canonicalUrl: null,
  });
  getPublishedNewsArticlesMock.mockResolvedValue([
    {
      id: "news_featured",
      slug: "openclaw-ships-control-plane",
      title: "OpenClaw ships a new control plane",
      summary: "The latest release improves multi-agent coordination.",
      content: "Full article body.",
      category: "Launches",
      tags: ["OpenClaw", "coordination"],
      featured: true,
      publishedAt: new Date("2026-04-19T12:00:00.000Z"),
      author: "AgentRiot Editorial",
      metaTitle: null,
      metaDescription: null,
      canonicalUrl: null,
    },
    {
      id: "news_secondary",
      slug: "relaycore-adds-observability-hooks",
      title: "RelayCore adds observability hooks",
      summary: "Operators now get better trace visibility.",
      content: "Another story.",
      category: "Infrastructure",
      tags: ["RelayCore", "ops"],
      featured: false,
      publishedAt: new Date("2026-04-18T12:00:00.000Z"),
      author: "AgentRiot Editorial",
      metaTitle: null,
      metaDescription: null,
      canonicalUrl: null,
    },
  ]);
  getSoftwareEntriesMock.mockResolvedValue([
    {
      id: "software_1",
      slug: "openclaw",
      name: "OpenClaw",
      description: "Agent framework for multi-agent runtimes.",
      category: "Frameworks",
      tags: ["orchestration"],
      officialUrl: "https://openclaw.dev",
      githubUrl: null,
      docsUrl: null,
      downloadUrl: null,
      relatedNewsIds: [],
      metaTitle: null,
      metaDescription: null,
    },
  ]);
  getPublicAgentPromptsMock.mockResolvedValue([
    {
      id: "prompt_1",
      agentId: "agent_1",
      agentName: "Atlas Research Agent",
      agentSlug: "atlas-research-agent",
      slug: "release-risk-brief",
      title: "Release risk brief",
      description: "Turns public release notes into an operator-ready risk summary.",
      prompt: "Review the public release notes.",
      expectedOutput: "A concise brief.",
      tags: ["release", "risk"],
      createdAt: new Date("2026-04-19T15:00:00.000Z"),
    },
    {
      id: "prompt_2",
      agentId: "agent_2",
      agentName: "RelayOps Agent",
      agentSlug: "relayops-agent",
      slug: "incident-recovery-summary",
      title: "Incident recovery summary",
      description: "Summarizes an agent operations incident safely.",
      prompt: "Convert incident notes into a public-safe summary.",
      expectedOutput: "A public-safe incident note.",
      tags: ["operations"],
      createdAt: new Date("2026-04-18T16:00:00.000Z"),
    },
  ]);
}

describe("homepage", () => {
  beforeEach(() => {
    getPublicGlobalFeedPageMock.mockReset();
    getFeaturedNewsArticleMock.mockReset();
    getPublishedNewsArticlesMock.mockReset();
    getSoftwareEntriesMock.mockReset();
    getPublicAgentPromptsMock.mockReset();
    mockContent();
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
    expect(markup).toContain("WORKING AGENTS");
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

    expect(markup).toContain("OpenClaw ships a new control plane");
    expect(markup).toContain("Launches");
    expect(markup).toContain("APR 19, 2026");
    expect(markup).toContain("/images/homepage/featured-story-network.svg");

    expect(markup).toContain("View All");
    expect(markup).toContain("Release risk brief");
    expect(markup).toContain("Atlas Research Agent");
    expect(markup).toContain('href="/prompts/release-risk-brief"');
    expect(markup).toContain("Live Agent Activity");
    expect(markup).toContain("View Full Feed");
    expect(markup).not.toContain("AutoGPT");
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
          signalType: "launch",
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
          signalType: "minor_release",
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
    expect(markup).toContain("MAJOR RELEASE");
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
    expect(markup).toContain('href="/prompts"');
    expect(markup).not.toContain('href="/explore"');
    expect(markup).not.toContain('href="/protocol"');
    expect(markup).not.toContain('href="/agent-instructions/research-assistant"');
    expect(markup).not.toContain('href="/agent-instructions/code-reviewer"');
    expect(markup).not.toContain('href="/agent-instructions/market-analyst"');
    expect(markup).toContain('href="/prompts/release-risk-brief"');
    expect(markup).toContain('href="/prompts/incident-recovery-summary"');
    expect(markup).toContain('href="/software/openclaw"');
    expect(markup).toContain('href="/news/openclaw-ships-control-plane"');
  });

  it("has SEO metadata", async () => {
    const pageModule = await import("@/app/page");
    expect(pageModule.metadata).toBeDefined();
    expect(pageModule.metadata.title).toContain("AgentRiot");
    expect(pageModule.metadata.description).toContain("agent software");
  });
});
