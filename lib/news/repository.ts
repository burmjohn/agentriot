import { readFile } from "node:fs/promises";

import { desc, eq } from "drizzle-orm";

import { createDb } from "@/db";
import { agents, newsArticles, softwareEntries } from "@/db/schema";

import { NEWS_SEED_AGENTS, NEWS_SEED_ARTICLES } from "./seed";
import type { NewsArticleDetail, NewsArticleRecord, RelatedAgentLink, RelatedSoftwareLink } from "./types";
import { SOFTWARE_SEED_ENTRIES } from "@/lib/software/seed";
import type { SoftwareEntryRecord } from "@/lib/software/types";

type FileStoreArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  tags?: string[];
  featured?: boolean;
  publishedAt?: string | null;
  author: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  canonicalUrl?: string | null;
};

type FileStoreSoftware = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
};

type FileStoreAgent = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  primarySoftwareId?: string | null;
  status?: string;
};

type ContentFileStore = {
  news?: FileStoreArticle[];
  software?: FileStoreSoftware[];
  agents?: FileStoreAgent[];
};

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function articleSearchText(article: Pick<NewsArticleRecord, "title" | "summary" | "content" | "tags">) {
  return normalizeText([article.title, article.summary, article.content, ...article.tags].join(" "));
}

function softwareSearchTerms(entry: Pick<SoftwareEntryRecord, "slug" | "name" | "tags">) {
  return Array.from(
    new Set(
      [entry.slug.replace(/-/g, " "), entry.name, ...entry.tags]
        .map(normalizeText)
        .filter(Boolean),
    ),
  );
}

function agentSearchTerms(agent: RelatedAgentLink) {
  return Array.from(
    new Set([agent.slug.replace(/-/g, " "), agent.name].map(normalizeText).filter(Boolean)),
  );
}

function mapNewsRecord(record: typeof newsArticles.$inferSelect): NewsArticleRecord | null {
  if (!record.publishedAt) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    content: record.content,
    category: record.category,
    tags: record.tags,
    featured: record.featured,
    publishedAt: record.publishedAt,
    author: record.author,
    metaTitle: record.metaTitle ?? null,
    metaDescription: record.metaDescription ?? null,
    canonicalUrl: record.canonicalUrl ?? null,
  };
}

function hydrateFileArticle(record: FileStoreArticle): NewsArticleRecord | null {
  if (!record.publishedAt) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    content: record.content,
    category: record.category,
    tags: record.tags ?? [],
    featured: record.featured ?? false,
    publishedAt: new Date(record.publishedAt),
    author: record.author,
    metaTitle: record.metaTitle ?? null,
    metaDescription: record.metaDescription ?? null,
    canonicalUrl: record.canonicalUrl ?? null,
  };
}

function hydrateFileSoftware(record: FileStoreSoftware): SoftwareEntryRecord {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    category: record.category,
    tags: record.tags ?? [],
    officialUrl: `https://${record.slug}.example.com`,
    githubUrl: null,
    docsUrl: null,
    downloadUrl: null,
    relatedNewsIds: [],
    metaTitle: null,
    metaDescription: null,
  };
}

function hydrateFileAgent(record: FileStoreAgent): RelatedAgentLink | null {
  if (record.status === "banned") {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    tagline: record.tagline,
  };
}

function sortArticles(records: NewsArticleRecord[]) {
  return [...records].sort((left, right) => {
    if (left.featured !== right.featured) {
      return Number(right.featured) - Number(left.featured);
    }

    return right.publishedAt.getTime() - left.publishedAt.getTime();
  });
}

function matchRelatedSoftware(article: NewsArticleRecord, records: SoftwareEntryRecord[]) {
  const haystack = articleSearchText(article);

  return records
    .filter((record) => softwareSearchTerms(record).some((term) => haystack.includes(term)))
    .slice(0, 3)
    .map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      category: record.category,
      description: record.description,
    })) satisfies RelatedSoftwareLink[];
}

function matchRelatedAgents(article: NewsArticleRecord, records: RelatedAgentLink[]) {
  const haystack = articleSearchText(article);

  return records
    .filter((record) => agentSearchTerms(record).some((term) => haystack.includes(term)))
    .slice(0, 3);
}

async function readFileStore(): Promise<{
  articles: NewsArticleRecord[];
  software: SoftwareEntryRecord[];
  agents: RelatedAgentLink[];
} | null> {
  const filePath = process.env.AGENTRIOT_FILE_STORE_PATH;

  if (!filePath) {
    return null;
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ContentFileStore;

    return {
      articles: sortArticles((parsed.news ?? []).map(hydrateFileArticle).filter((record): record is NewsArticleRecord => record !== null)),
      software: (parsed.software ?? []).map(hydrateFileSoftware),
      agents: (parsed.agents ?? []).map(hydrateFileAgent).filter((record): record is RelatedAgentLink => record !== null),
    };
  } catch {
    return null;
  }
}

async function listSeedContext() {
  return {
    articles: sortArticles(NEWS_SEED_ARTICLES),
    software: SOFTWARE_SEED_ENTRIES,
    agents: NEWS_SEED_AGENTS,
  };
}

async function listRepositoryContext() {
  const fileStore = await readFileStore();

  if (fileStore && fileStore.articles.length > 0) {
    return fileStore;
  }

  try {
    const db = createDb();
    const [articleRows, softwareRows, agentRows] = await Promise.all([
      db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt)),
      db.select().from(softwareEntries),
      db
        .select({
          id: agents.id,
          slug: agents.slug,
          name: agents.name,
          tagline: agents.tagline,
          status: agents.status,
        })
        .from(agents),
    ]);

    const articles = sortArticles(articleRows.map(mapNewsRecord).filter((record): record is NewsArticleRecord => record !== null));
    const software = softwareRows.map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      description: record.description,
      category: record.category,
      tags: record.tags,
      officialUrl: record.officialUrl,
      githubUrl: record.githubUrl ?? null,
      docsUrl: record.docsUrl ?? null,
      downloadUrl: record.downloadUrl ?? null,
      relatedNewsIds: record.relatedNewsIds,
      metaTitle: record.metaTitle ?? null,
      metaDescription: record.metaDescription ?? null,
    })) satisfies SoftwareEntryRecord[];
    const publicAgents = agentRows
      .filter((record) => record.status !== "banned")
      .map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        tagline: record.tagline,
      })) satisfies RelatedAgentLink[];

    if (articles.length > 0) {
      return {
        articles,
        software,
        agents: publicAgents,
      };
    }
  } catch {
    // Fall back to local seed data when shared content storage is unavailable.
  }

  return listSeedContext();
}

export async function listPublishedNewsArticles() {
  const { articles } = await listRepositoryContext();
  return articles;
}

export async function getFeaturedNewsArticle() {
  const articles = await listPublishedNewsArticles();
  return articles.find((article) => article.featured) ?? articles[0] ?? null;
}

export async function getNewsArticleBySlug(slug: string): Promise<NewsArticleDetail | null> {
  const fileStore = await readFileStore();

  if (fileStore && fileStore.articles.length > 0) {
    const article = fileStore.articles.find((record) => record.slug === slug);

    if (!article) {
      return null;
    }

    return {
      ...article,
      relatedSoftware: matchRelatedSoftware(article, fileStore.software),
      relatedAgents: matchRelatedAgents(article, fileStore.agents),
    };
  }

  try {
    const db = createDb();
    const [record] = await db.select().from(newsArticles).where(eq(newsArticles.slug, slug)).limit(1);
    const article = record ? mapNewsRecord(record) : null;

    if (!article) {
      return null;
    }

    const [softwareRows, agentRows] = await Promise.all([
      db.select().from(softwareEntries),
      db
        .select({
          id: agents.id,
          slug: agents.slug,
          name: agents.name,
          tagline: agents.tagline,
          status: agents.status,
        })
        .from(agents),
    ]);

    const software = softwareRows.map((entry) => ({
      id: entry.id,
      slug: entry.slug,
      name: entry.name,
      description: entry.description,
      category: entry.category,
      tags: entry.tags,
      officialUrl: entry.officialUrl,
      githubUrl: entry.githubUrl ?? null,
      docsUrl: entry.docsUrl ?? null,
      downloadUrl: entry.downloadUrl ?? null,
      relatedNewsIds: entry.relatedNewsIds,
      metaTitle: entry.metaTitle ?? null,
      metaDescription: entry.metaDescription ?? null,
    })) satisfies SoftwareEntryRecord[];
    const publicAgents = agentRows
      .filter((entry) => entry.status !== "banned")
      .map((entry) => ({
        id: entry.id,
        slug: entry.slug,
        name: entry.name,
        tagline: entry.tagline,
      })) satisfies RelatedAgentLink[];

    return {
      ...article,
      relatedSoftware: matchRelatedSoftware(article, software),
      relatedAgents: matchRelatedAgents(article, publicAgents),
    };
  } catch {
    const seedArticle = NEWS_SEED_ARTICLES.find((record) => record.slug === slug);

    if (!seedArticle) {
      return null;
    }

    return {
      ...seedArticle,
      relatedSoftware: matchRelatedSoftware(seedArticle, SOFTWARE_SEED_ENTRIES),
      relatedAgents: matchRelatedAgents(seedArticle, NEWS_SEED_AGENTS),
    };
  }
}
