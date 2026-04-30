import { desc, eq } from "drizzle-orm";

import { createDb } from "@/db";
import { agents, newsArticles, softwareEntries } from "@/db/schema";

import type { NewsArticleDetail, NewsArticleRecord, RelatedAgentLink, RelatedSoftwareLink } from "./types";
import type { SoftwareEntryRecord } from "@/lib/software/types";

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

function mapSoftwareRecord(record: typeof softwareEntries.$inferSelect): SoftwareEntryRecord {
  return {
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

async function listRepositoryContext() {
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

  return {
    articles: sortArticles(articleRows.map(mapNewsRecord).filter((record): record is NewsArticleRecord => record !== null)),
    software: softwareRows.map(mapSoftwareRecord),
    agents: agentRows
      .filter((record) => record.status !== "banned")
      .map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        tagline: record.tagline,
      })) satisfies RelatedAgentLink[],
  };
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
    relatedSoftware: matchRelatedSoftware(article, softwareRows.map(mapSoftwareRecord)),
    relatedAgents: matchRelatedAgents(article, publicAgents),
  };
}
