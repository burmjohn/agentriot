import { readFile } from "node:fs/promises";

import { desc, eq } from "drizzle-orm";

import { createDb } from "@/db";
import { agents, newsArticles, softwareEntries } from "@/db/schema";

import { NEWS_SEED_ARTICLES } from "@/lib/news/seed";
import { SOFTWARE_SEED_AGENTS, SOFTWARE_SEED_ENTRIES } from "./seed";
import type { RelatedAgentLink, RelatedNewsLink, SoftwareEntryDetail, SoftwareEntryRecord } from "./types";

type FileStoreSoftware = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  tags?: string[];
  officialUrl: string;
  githubUrl?: string | null;
  docsUrl?: string | null;
  downloadUrl?: string | null;
  relatedNewsIds?: string[];
  metaTitle?: string | null;
  metaDescription?: string | null;
};

type FileStoreAgent = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  primarySoftwareId?: string | null;
  status?: string;
};

type FileStoreArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags?: string[];
  content?: string;
  publishedAt?: string | null;
};

type ContentFileStore = {
  software?: FileStoreSoftware[];
  agents?: FileStoreAgent[];
  news?: FileStoreArticle[];
};

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

function hydrateFileSoftware(record: FileStoreSoftware): SoftwareEntryRecord {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    description: record.description,
    category: record.category,
    tags: record.tags ?? [],
    officialUrl: record.officialUrl,
    githubUrl: record.githubUrl ?? null,
    docsUrl: record.docsUrl ?? null,
    downloadUrl: record.downloadUrl ?? null,
    relatedNewsIds: record.relatedNewsIds ?? [],
    metaTitle: record.metaTitle ?? null,
    metaDescription: record.metaDescription ?? null,
  };
}

function hydrateFileAgent(record: FileStoreAgent): (RelatedAgentLink & { primarySoftwareId: string | null }) | null {
  if (record.status === "banned") {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    tagline: record.tagline,
    primarySoftwareId: record.primarySoftwareId ?? null,
  };
}

function hydrateFileNews(record: FileStoreArticle): RelatedNewsLink | null {
  if (!record.publishedAt) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    category: record.category,
    publishedAt: new Date(record.publishedAt),
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

async function readFileStore(): Promise<{
  software: SoftwareEntryRecord[];
  agents: Array<RelatedAgentLink & { primarySoftwareId: string | null }>;
  news: Array<RelatedNewsLink & { tags?: string[]; content?: string }>;
} | null> {
  const filePath = process.env.AGENTRIOT_FILE_STORE_PATH;

  if (!filePath) {
    return null;
  }

  try {
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as ContentFileStore;
    const news = (parsed.news ?? []).reduce<Array<RelatedNewsLink & { tags?: string[]; content?: string }>>(
      (collection, record) => {
        const hydrated = hydrateFileNews(record);

        if (!hydrated) {
          return collection;
        }

        collection.push({
          ...hydrated,
          tags: record.tags ?? [],
          content: record.content ?? "",
        });

        return collection;
      },
      [],
    );

    return {
      software: sortSoftware((parsed.software ?? []).map(hydrateFileSoftware)),
      agents: (parsed.agents ?? []).map(hydrateFileAgent).filter((record): record is RelatedAgentLink & { primarySoftwareId: string | null } => record !== null),
      news,
    };
  } catch {
    return null;
  }
}

async function listSeedContext() {
  return {
    software: sortSoftware(SOFTWARE_SEED_ENTRIES),
    agents: SOFTWARE_SEED_AGENTS,
    news: sortNews(
      NEWS_SEED_ARTICLES.map((record) => ({
        id: record.id,
        slug: record.slug,
        title: record.title,
        summary: record.summary,
        category: record.category,
        publishedAt: record.publishedAt,
        tags: record.tags,
        content: record.content,
      })),
    ),
  };
}

async function listRepositoryContext() {
  const fileStore = await readFileStore();

  if (fileStore && fileStore.software.length > 0) {
    return fileStore;
  }

  try {
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

    const software = sortSoftware(softwareRows.map(mapSoftwareRecord));
    const publicAgents = agentRows
      .filter((record) => record.status !== "banned")
      .map((record) => ({
        id: record.id,
        slug: record.slug,
        name: record.name,
        tagline: record.tagline,
        primarySoftwareId: record.primarySoftwareId ?? null,
      }));
    const news = sortNews(
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
    );

    if (software.length > 0) {
      return {
        software,
        agents: publicAgents,
        news,
      };
    }
  } catch {
    // Fall back to local seed data when shared content storage is unavailable.
  }

  return listSeedContext();
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
  const fileStore = await readFileStore();

  if (fileStore && fileStore.software.length > 0) {
    const entry = fileStore.software.find((record) => record.slug === slug);

    if (!entry) {
      return null;
    }

    return {
      ...entry,
      relatedAgents: matchRelatedAgents(entry, fileStore.agents),
      relatedNews: matchRelatedNews(entry, fileStore.news),
    };
  }

  try {
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
  } catch {
    const seedEntry = SOFTWARE_SEED_ENTRIES.find((record) => record.slug === slug);

    if (!seedEntry) {
      return null;
    }

    return {
      ...seedEntry,
      relatedAgents: matchRelatedAgents(seedEntry, SOFTWARE_SEED_AGENTS),
      relatedNews: matchRelatedNews(
        seedEntry,
        NEWS_SEED_ARTICLES.map((record) => ({
          id: record.id,
          slug: record.slug,
          title: record.title,
          summary: record.summary,
          category: record.category,
          publishedAt: record.publishedAt,
          tags: record.tags,
          content: record.content,
        })),
      ),
    };
  }
}
