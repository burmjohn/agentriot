import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getLlmsTxt } from "@/app/llms.txt/route";
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

describe("machine-readable routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    listPublishedAgents.mockResolvedValue([]);
    listPublishedPrompts.mockResolvedValue([]);
    listPublishedSkills.mockResolvedValue([]);
  });

  it("llms.txt serves explicit cache headers", () => {
    const response = getLlmsTxt();

    expect(response.headers.get("content-type")).toContain("text/plain");
  });

  it("llms.txt contains primary section routes", async () => {
    const response = getLlmsTxt();
    const body = await response.text();

    expect(body).toContain("/agents");
    expect(body).toContain("/prompts");
    expect(body).toContain("/skills");
    expect(body).toContain("/tutorials");
    expect(body).toContain("/articles");
    expect(body).toContain("/search");
  });

  it("llms.txt contains machine-readable entry point references and aligned positioning copy", async () => {
    const response = getLlmsTxt();
    const body = await response.text();

    expect(body).toContain("/sitemap.xml");
    expect(body).toContain("/robots.txt");
    expect(body).toContain("/feed.xml");
    expect(body).toContain("/feed.json");
    expect(body).toContain("AgentRiot is the connected discovery surface for agentic coding.");
  });
});

describe("feed route handlers", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    listPublishedAgents.mockResolvedValue([]);
    listPublishedPrompts.mockResolvedValue([]);
    listPublishedSkills.mockResolvedValue([]);
    listPublishedContent.mockResolvedValue([]);
  });

  it("feed.xml GET returns application/rss+xml content-type", async () => {
    const response = await getFeedXml();
    expect(response.headers.get("content-type")).toContain("application/rss+xml");
  });

  it("feed.xml GET serves a valid RSS feed structure", async () => {
    const response = await getFeedXml();
    const body = await response.text();
    expect(body).toContain("<rss");
    expect(body).toContain("<title>AgentRiot feed</title>");
  });

  it("feed.json GET returns application/json content-type", async () => {
    const response = await getFeedJson();
    expect(response.headers.get("content-type")).toContain("application/json");
  });

  it("feed.json GET returns a JSON feed with correct version", async () => {
    const response = await getFeedJson();
    const feed = await response.json();
    expect(feed.version).toBe("https://jsonfeed.org/version/1.1");
  });
});
