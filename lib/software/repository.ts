import { desc, eq } from "drizzle-orm";

import { createDb } from "@/db";
import { agents, newsArticles, softwareEntries } from "@/db/schema";

import type { RelatedAgentLink, RelatedNewsLink, SoftwareEntryDetail, SoftwareEntryRecord } from "./types";

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function softwareSearchText(record: Pick<SoftwareEntryRecord, "name" | "description" | "slug" | "tags">) {
  return normalizeText([record.name, record.description, record.slug, ...record.tags].join(" "));
}

function articleSearchText(record: Pick<RelatedNewsLink, "title" | "summary" | "category"> & { tags?: string[]; content?: string }) {
  return normalizeText([record.title, record.summary, record.category, record.content ?? "", ...(record.tags ?? [])].join(" "));
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

function sortSoftware(records: SoftwareEntryRecord[]) {
  return [...records].sort((left, right) => left.name.localeCompare(right.name));
}

function sortNews(records: RelatedNewsLink[]) {
  return [...records].sort((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime());
}

function matchRelatedNews(entry: SoftwareEntryRecord, records: Array<RelatedNewsLink & { tags?: string[]; content?: string }>) {
  const explicitIds = new Set(entry.relatedNewsIds);

  return sortNews(
    records.filter((record) => {
      if (explicitIds.has(record.id)) {
        return true;
      }

      return articleSearchText(record).includes(normalizeText(entry.name))
        || articleSearchText(record).includes(normalizeText(entry.slug.replace(/-/g, " ")))
        || entry.tags.some((tag) => articleSearchText(record).includes(normalizeText(tag)));
    }),
  ).slice(0, 3);
}

function matchRelatedAgents(entry: SoftwareEntryRecord, records: Array<RelatedAgentLink & { primarySoftwareId: string | null }>) {
  const haystack = softwareSearchText(entry);

  return records
    .filter((record) => {
      if (record.primarySoftwareId === entry.id) {
        return true;
      }

      return haystack.includes(normalizeText(record.name)) || haystack.includes(normalizeText(record.slug.replace(/-/g, " ")));
    })
    .slice(0, 6)
    .map(({ id, slug, name, tagline }) => ({ id, slug, name, tagline }));
}

async function listRepositoryContext() {
  const db = createDb();
  const [softwareRows, agentRows, newsRows] = await Promise.all([
    db.select().from(softwareEntries),
    db
      .select({
        id: agents.id,
        slug: agents.slug,
        name: agents.name,
        tagline: agents.tagline,
        primarySoftwareId: agents.primarySoftwareId,
        status: agents.status,
      })
      .from(agents),
    db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt)),
  ]);

  return {
    software: sortSoftware(softwareRows.map(mapSoftwareRecord)),
    agents: agentRows
      .filter((record) => record.status !== "banned")
      .map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        tagline: record.tagline,
        primarySoftwareId: record.primarySoftwareId ?? null,
      })),
    news: sortNews(
      newsRows
        .filter((record) => record.publishedAt)
        .map((record) => ({
          id: record.id,
          slug: record.slug,
          title: record.title,
          summary: record.summary,
          category: record.category,
          publishedAt: record.publishedAt as Date,
          tags: record.tags,
          content: record.content,
        })),
    ),
  };
}

export async function listSoftwareEntries() {
  const { software } = await listRepositoryContext();
  return software;
}

export async function listSoftwareEntriesByCategory(category: string) {
  const entries = await listSoftwareEntries();
  return entries.filter((record) => record.category.toLowerCase() === category.toLowerCase());
}

export async function listSoftwareCategories() {
  const entries = await listSoftwareEntries();
  return Array.from(new Set(entries.map((record) => record.category))).sort((left, right) => left.localeCompare(right));
}

export async function getSoftwareEntryBySlug(slug: string): Promise<SoftwareEntryDetail | null> {
  const db = createDb();
  const [softwareRecord] = await db.select().from(softwareEntries).where(eq(softwareEntries.slug, slug)).limit(1);

  if (!softwareRecord) {
    return null;
  }

  const entry = mapSoftwareRecord(softwareRecord);
  const [agentRows, newsRows] = await Promise.all([
    db
      .select({
        id: agents.id,
        slug: agents.slug,
        name: agents.name,
        tagline: agents.tagline,
        primarySoftwareId: agents.primarySoftwareId,
        status: agents.status,
      })
      .from(agents),
    db.select().from(newsArticles).orderBy(desc(newsArticles.publishedAt), desc(newsArticles.createdAt)),
  ]);
  const publicAgents = agentRows
    .filter((record) => record.status !== "banned")
    .map((record) => ({
      id: record.id,
      slug: record.slug,
      name: record.name,
      tagline: record.tagline,
      primarySoftwareId: record.primarySoftwareId ?? null,
    }));
  const publicNews = newsRows
    .filter((record) => record.publishedAt)
    .map((record) => ({
      id: record.id,
      slug: record.slug,
      title: record.title,
      summary: record.summary,
      category: record.category,
      publishedAt: record.publishedAt as Date,
      tags: record.tags,
      content: record.content,
    }));

  return {
    ...entry,
    relatedAgents: matchRelatedAgents(entry, publicAgents),
    relatedNews: matchRelatedNews(entry, publicNews),
  };
}
