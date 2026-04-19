import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notFoundMock = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const getFeaturedNewsArticleMock = vi.fn();
const getPublishedNewsArticlesMock = vi.fn();
const getNewsArticleBySlugMock = vi.fn();

const getSoftwareCategoriesMock = vi.fn();
const getSoftwareEntriesMock = vi.fn();
const getSoftwareEntriesByCategoryMock = vi.fn();
const getSoftwareEntryBySlugMock = vi.fn();

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/lib/news", () => ({
  getFeaturedNewsArticle: getFeaturedNewsArticleMock,
  getPublishedNewsArticles: getPublishedNewsArticlesMock,
  getNewsArticleBySlug: getNewsArticleBySlugMock,
}));

vi.mock("@/lib/software", () => ({
  getSoftwareCategories: getSoftwareCategoriesMock,
  getSoftwareEntries: getSoftwareEntriesMock,
  getSoftwareEntriesByCategory: getSoftwareEntriesByCategoryMock,
  getSoftwareEntryBySlug: getSoftwareEntryBySlugMock,
}));

describe("content pages", () => {
  beforeEach(() => {
    notFoundMock.mockClear();
    getFeaturedNewsArticleMock.mockReset();
    getPublishedNewsArticlesMock.mockReset();
    getNewsArticleBySlugMock.mockReset();
    getSoftwareCategoriesMock.mockReset();
    getSoftwareEntriesMock.mockReset();
    getSoftwareEntriesByCategoryMock.mockReset();
    getSoftwareEntryBySlugMock.mockReset();
  });

  it("news index renders featured and secondary stories", async () => {
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

    const pageModule = await import("@/app/news/page");
    const markup = renderToStaticMarkup(await pageModule.default());

    expect(markup).toContain("OpenClaw ships a new control plane");
    expect(markup).toContain("RelayCore adds observability hooks");
    expect(markup).toContain("/news/openclaw-ships-control-plane");
  });

  it("article page renders metadata and linked software or agents", async () => {
    getNewsArticleBySlugMock.mockResolvedValue({
      id: "news_featured",
      slug: "openclaw-ships-control-plane",
      title: "OpenClaw ships a new control plane",
      summary: "The latest release improves multi-agent coordination.",
      content:
        "OpenClaw introduced a control plane update. Atlas Research Agent verified the release.",
      category: "Launches",
      tags: ["OpenClaw", "Atlas Research Agent", "coordination"],
      featured: true,
      publishedAt: new Date("2026-04-19T12:00:00.000Z"),
      author: "AgentRiot Editorial",
      metaTitle: "OpenClaw control plane launch",
      metaDescription: "Editorial view on the OpenClaw control plane launch.",
      canonicalUrl: null,
      relatedSoftware: [
        {
          id: "software_1",
          slug: "openclaw",
          name: "OpenClaw",
          category: "Frameworks",
          description: "Agent framework for multi-agent runtimes.",
        },
      ],
      relatedAgents: [
        {
          id: "agent_1",
          slug: "atlas-research-agent",
          name: "Atlas Research Agent",
          tagline: "Tracks launches and major releases.",
        },
      ],
    });

    const pageModule = await import("@/app/news/[slug]/page");
    const metadata = await pageModule.generateMetadata({
      params: Promise.resolve({ slug: "openclaw-ships-control-plane" }),
    });
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({ slug: "openclaw-ships-control-plane" }),
      }),
    );

    expect(metadata.title).toBe("OpenClaw control plane launch | AgentRiot");
    expect(metadata.description).toBe(
      "Editorial view on the OpenClaw control plane launch.",
    );
    expect(metadata.alternates?.canonical).toBe(
      "http://localhost:3000/news/openclaw-ships-control-plane",
    );
    expect(markup).toContain("Atlas Research Agent");
    expect(markup).toContain("/software/openclaw");
    expect(markup).toContain("/agents/atlas-research-agent");
  });

  it("software index renders category-filtered directory and noindexes filter views", async () => {
    getSoftwareCategoriesMock.mockResolvedValue(["Frameworks", "Infrastructure"]);
    getSoftwareEntriesByCategoryMock.mockResolvedValue([
      {
        id: "software_1",
        slug: "openclaw",
        name: "OpenClaw",
        description: "Agent framework for multi-agent runtimes.",
        category: "Frameworks",
        tags: ["orchestration"],
        officialUrl: "https://openclaw.dev",
        githubUrl: "https://github.com/example/openclaw",
        docsUrl: "https://docs.openclaw.dev",
        downloadUrl: "https://openclaw.dev/download",
        relatedNewsIds: [],
        metaTitle: null,
        metaDescription: null,
      },
    ]);

    const pageModule = await import("@/app/software/page");
    const metadata = await pageModule.generateMetadata({
      searchParams: Promise.resolve({ category: "Frameworks" }),
    });
    const markup = renderToStaticMarkup(
      await pageModule.default({
        searchParams: Promise.resolve({ category: "Frameworks" }),
      }),
    );

    expect(metadata.robots).toMatchObject({ index: false, follow: false });
    expect(markup).toContain("OpenClaw");
    expect(markup).toContain("Frameworks");
    expect(markup).toContain("/software/openclaw");
  });

  it("software detail shows linked agents and related news", async () => {
    getSoftwareEntryBySlugMock.mockResolvedValue({
      id: "software_1",
      slug: "openclaw",
      name: "OpenClaw",
      description: "Agent framework for multi-agent runtimes.",
      category: "Frameworks",
      tags: ["orchestration", "control-plane"],
      officialUrl: "https://openclaw.dev",
      githubUrl: "https://github.com/example/openclaw",
      docsUrl: "https://docs.openclaw.dev",
      downloadUrl: "https://openclaw.dev/download",
      relatedNewsIds: ["news_featured"],
      metaTitle: "OpenClaw software profile",
      metaDescription: "Canonical software entry for OpenClaw on AgentRiot.",
      relatedAgents: [
        {
          id: "agent_1",
          slug: "atlas-research-agent",
          name: "Atlas Research Agent",
          tagline: "Tracks launches and major releases.",
        },
      ],
      relatedNews: [
        {
          id: "news_featured",
          slug: "openclaw-ships-control-plane",
          title: "OpenClaw ships a new control plane",
          summary: "The latest release improves multi-agent coordination.",
          category: "Launches",
          publishedAt: new Date("2026-04-19T12:00:00.000Z"),
        },
      ],
    });

    const pageModule = await import("@/app/software/[slug]/page");
    const markup = renderToStaticMarkup(
      await pageModule.default({
        params: Promise.resolve({ slug: "openclaw" }),
      }),
    );

    expect(markup).toContain("Atlas Research Agent");
    expect(markup).toContain("/agents/atlas-research-agent");
    expect(markup).toContain("/news/openclaw-ships-control-plane");
    expect(markup).toContain("https://openclaw.dev");
  });

  it("returns 404 when content is missing", async () => {
    getNewsArticleBySlugMock.mockResolvedValue(null);
    getSoftwareEntryBySlugMock.mockResolvedValue(null);

    const articlePageModule = await import("@/app/news/[slug]/page");
    const softwarePageModule = await import("@/app/software/[slug]/page");

    await expect(
      articlePageModule.default({
        params: Promise.resolve({ slug: "missing-story" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    await expect(
      softwarePageModule.default({
        params: Promise.resolve({ slug: "missing-software" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(2);
  });
});
