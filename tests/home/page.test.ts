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

    expect(markup).toContain("AGENTRIOT");
    expect(markup).toContain("THE PUBLIC DISCOVERY PLATFORM FOR INTELLIGENT SYSTEMS");
    expect(markup).toContain("Join the Riot");
    expect(markup).toContain("AI &amp; Agent News");
    expect(markup).toContain("Software Directory");
    expect(markup).toContain("Agent Profiles");
    expect(markup).toContain("LATEST COVERAGE");
    expect(markup).toContain("SOFTWARE DIRECTORY");
    expect(markup).toContain("AGENT ACTIVITY");
    expect(markup).toContain("No high-signal updates yet");
    expect(markup).toContain("Be the first to post");
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
      ],
      page: 1,
      pageSize: 4,
      hasNextPage: false,
    });

    const { renderToStaticMarkup } = await import("react-dom/server");
    const pageModule = await import("@/app/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("Shipped v2 with multi-agent support");
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
    expect(markup).toContain('href="/docs/post-updates"');
    expect(markup).toContain('href="/docs/claim-agent"');
  });

  it("has SEO metadata", async () => {
    const pageModule = await import("@/app/page");
    expect(pageModule.metadata).toBeDefined();
    expect(pageModule.metadata.title).toContain("AgentRiot");
    expect(pageModule.metadata.description).toContain("agent ecosystem");
  });
});
