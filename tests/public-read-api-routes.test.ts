import { beforeEach, describe, expect, it, vi } from "vitest";

const listPublishedContent = vi.fn();
const getPublishedContentDetail = vi.fn();
const listTaxonomyTermsByScope = vi.fn();
const searchPublishedGraph = vi.fn();

vi.mock("@/lib/public/hub", () => ({
  listPublishedContent,
  getPublishedContentDetail,
  listTaxonomyTermsByScope,
  searchPublishedGraph,
}));

describe("public read API routes", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("returns a versioned collection response for article records", async () => {
    listPublishedContent.mockResolvedValue([
      {
        id: "content-1",
        kind: "article",
        title: "Weekly coding-agent signal",
        slug: "weekly-coding-agent-signal",
      },
    ]);

    const { GET } = await import("@/app/api/v1/articles/route");
    const response = await GET(
      new Request("http://localhost:3011/api/v1/articles?term=coding-agents"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: "content-1",
          kind: "article",
          title: "Weekly coding-agent signal",
          slug: "weekly-coding-agent-signal",
        },
      ],
      meta: {
        count: 1,
        entity: "articles",
        query: { term: "coding-agents" },
        version: "v1",
      },
    });
    expect(listPublishedContent).toHaveBeenCalledWith("article", "coding-agents");
  });

  it("returns a stable not-found envelope for missing article details", async () => {
    getPublishedContentDetail.mockResolvedValue(null);

    const { GET } = await import("@/app/api/v1/articles/[slug]/route");
    const response = await GET(
      new Request("http://localhost:3011/api/v1/articles/missing-story"),
      { params: Promise.resolve({ slug: "missing-story" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        details: { slug: "missing-story" },
        message: "Article not found.",
      },
      meta: {
        version: "v1",
      },
    });
    expect(getPublishedContentDetail).toHaveBeenCalledWith("article", "missing-story");
  });

  it("returns taxonomy records for a valid scope", async () => {
    listTaxonomyTermsByScope.mockResolvedValue([
      {
        id: "term-1",
        label: "Coding Agent",
        slug: "coding-agent",
        kind: "type",
        scope: "agent",
      },
    ]);

    const { GET } = await import("@/app/api/v1/taxonomy/route");
    const response = await GET(
      new Request("http://localhost:3011/api/v1/taxonomy?scope=agent"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: "term-1",
          label: "Coding Agent",
          slug: "coding-agent",
          kind: "type",
          scope: "agent",
        },
      ],
      meta: {
        count: 1,
        entity: "taxonomy",
        query: { scope: "agent" },
        version: "v1",
      },
    });
  });

  it("rejects invalid taxonomy scopes with a stable error", async () => {
    const { GET } = await import("@/app/api/v1/taxonomy/route");
    const response = await GET(
      new Request("http://localhost:3011/api/v1/taxonomy?scope=bad-scope"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_scope",
        details: { scope: "bad-scope" },
        message: "Scope must be one of content, agent, prompt, or skill.",
      },
      meta: {
        version: "v1",
      },
    });
    expect(listTaxonomyTermsByScope).not.toHaveBeenCalled();
  });

  it("normalizes search queries before querying the graph", async () => {
    searchPublishedGraph.mockResolvedValue([
      {
        id: "prompt-1",
        title: "Repository Evaluator",
        href: "/prompts/repository-evaluator",
        meta: "Repo-aware prompt",
        kind: "prompt",
      },
    ]);

    const { GET } = await import("@/app/api/v1/search/route");
    const response = await GET(
      new Request("http://localhost:3011/api/v1/search?q=%20%20repo%20context%20%20"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: [
        {
          id: "prompt-1",
          title: "Repository Evaluator",
          href: "/prompts/repository-evaluator",
          meta: "Repo-aware prompt",
          kind: "prompt",
        },
      ],
      meta: {
        count: 1,
        entity: "search",
        query: { q: "repo context" },
        version: "v1",
      },
    });
    expect(searchPublishedGraph).toHaveBeenCalledWith("repo context");
  });
});
