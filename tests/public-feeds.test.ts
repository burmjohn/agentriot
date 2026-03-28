import { describe, expect, it } from "vitest";
import { buildJsonFeed, buildRssFeedXml, type PublicFeedItem } from "@/lib/public/feeds";

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
});
