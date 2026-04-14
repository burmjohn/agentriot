import { beforeEach, describe, expect, it, vi } from "vitest";
import { buildJsonFeed, buildRssFeedXml, type PublicFeedItem } from "@/lib/public/feeds";
import { GET as getFeedXml } from "@/app/feed.xml/route";
import { GET as getFeedJson } from "@/app/feed.json/route";

const {
  listPublishedContent,
  listPublishedAgents,
  listPublishedPrompts,
  listPublishedSkills,
} = vi.hoisted(() => ({
  listPublishedContent: vi.fn(),
  listPublishedAgents: vi.fn(),
  listPublishedPrompts: vi.fn(),
  listPublishedSkills: vi.fn(),
}));

vi.mock("@/lib/public/hub", () => ({
  listPublishedContent,
  listPublishedAgents,
  listPublishedPrompts,
  listPublishedSkills,
}));

const items: PublicFeedItem[] = [
  {
    id: "content-1",
    kind: "article",
    title: "What Changed This Week in Coding Agents",
    href: "/articles/what-changed-this-week-in-coding-agents",
    summary: "A weekly signal post covering the changes that matter right now.",
    publishedAt: new Date("2026-03-28T12:00:00.000Z"),
  },
  {
    id: "agent-1",
    kind: "agent",
    title: "Claude Code",
    href: "/agents/claude-code",
    summary: "Repo-aware coding agent with strong workflow relevance.",
    publishedAt: new Date("2026-03-28T10:00:00.000Z"),
  },
];

describe("buildRssFeedXml", () => {
  it("serializes a valid RSS feed with absolute links", () => {
    const xml = buildRssFeedXml(items, {
      siteUrl: "https://agentriot.com",
      feedUrl: "https://agentriot.com/feed.xml",
      title: "AgentRiot feed",
      description: "Latest signal from AgentRiot.",
    });

    expect(xml).toContain("<rss");
    expect(xml).toContain("<title>AgentRiot feed</title>");
    expect(xml).toContain(
      "<link>https://agentriot.com/articles/what-changed-this-week-in-coding-agents</link>",
    );
    expect(xml).toContain("<category>agent</category>");
  });

  it("uses a professional fallback description when summary is null", () => {
    const itemsWithoutSummary: PublicFeedItem[] = [
      {
        id: "skill-1",
        kind: "skill",
        title: "Workflow Composition",
        href: "/skills/workflow-composition",
        summary: null,
        publishedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ];

    const xml = buildRssFeedXml(itemsWithoutSummary, {
      siteUrl: "https://agentriot.com",
      feedUrl: "https://agentriot.com/feed.xml",
      title: "AgentRiot feed",
      description: "Latest signal from AgentRiot.",
    });

    expect(xml).toContain("<description>Explore skill on AgentRiot.</description>");
  });
});

describe("buildJsonFeed", () => {
  it("serializes a JSON feed with item ids and absolute URLs", () => {
    const feed = buildJsonFeed(items, {
      siteUrl: "https://agentriot.com",
      feedUrl: "https://agentriot.com/feed.json",
      title: "AgentRiot feed",
      description: "Latest signal from AgentRiot.",
    });

    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(feed.home_page_url).toBe("https://agentriot.com");
    expect(feed.feed_url).toBe("https://agentriot.com/feed.json");
    expect(feed.items[0]).toMatchObject({
      id: "content-1",
      url: "https://agentriot.com/articles/what-changed-this-week-in-coding-agents",
      title: "What Changed This Week in Coding Agents",
      content_text: "A weekly signal post covering the changes that matter right now.",
    });
  });

  it("uses a professional fallback summary when summary is null", () => {
    const itemsWithoutSummary: PublicFeedItem[] = [
      {
        id: "agent-1",
        kind: "agent",
        title: "Claude Code",
        href: "/agents/claude-code",
        summary: null,
        publishedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ];

    const feed = buildJsonFeed(itemsWithoutSummary, {
      siteUrl: "https://agentriot.com",
      feedUrl: "https://agentriot.com/feed.json",
      title: "AgentRiot feed",
      description: "Latest signal from AgentRiot.",
    });

    expect(feed.items[0].content_text).toBe("Explore agent on AgentRiot.");
  });

  it("uses a professional fallback summary for tutorial kind when summary is null", () => {
    const itemsWithoutSummary: PublicFeedItem[] = [
      {
        id: "tutorial-1",
        kind: "tutorial",
        title: "Build an Agent News Pipeline",
        href: "/tutorials/build-an-agent-news-pipeline",
        summary: null,
        publishedAt: new Date("2026-03-28T10:00:00.000Z"),
      },
    ];

    const feed = buildJsonFeed(itemsWithoutSummary, {
      siteUrl: "https://agentriot.com",
      feedUrl: "https://agentriot.com/feed.json",
      title: "AgentRiot feed",
      description: "Latest signal from AgentRiot.",
    });

    expect(feed.items[0].content_text).toBe("Explore tutorial on AgentRiot.");
  });
});

describe("feed route handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    listPublishedContent.mockResolvedValue([]);
    listPublishedAgents.mockResolvedValue([]);
    listPublishedPrompts.mockResolvedValue([]);
    listPublishedSkills.mockResolvedValue([]);
  });

  it("feed.xml GET returns application/rss+xml content-type", async () => {
    const response = await getFeedXml();
    expect(response.headers.get("content-type")).toContain("application/rss+xml");
  });

  it("feed.xml GET uses the AgentRiot feed title and aligned positioning copy in the response body", async () => {
    const response = await getFeedXml();
    const body = await response.text();
    expect(body).toContain("<title>AgentRiot feed</title>");
    expect(body).toContain("The connected discovery surface for agentic coding.");
  });

  it("feed.json GET returns application/json content-type", async () => {
    const response = await getFeedJson();
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("feed.json GET returns a JSON feed with correct version and aligned positioning copy", async () => {
    const response = await getFeedJson();
    const feed = await response.json();
    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
    expect(feed.description).toBe("The connected discovery surface for agentic coding.");
  });
});
