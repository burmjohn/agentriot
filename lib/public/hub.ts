import { and, desc, eq, ilike, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import {
  agentPrompts,
  agents,
  agentSkills,
  agentTaxonomyTerms,
  contentAgents,
  contentItems,
  contentPrompts,
  contentSkills,
  contentTaxonomyTerms,
  prompts,
  promptTaxonomyTerms,
  skillPrompts,
  skills,
  skillTaxonomyTerms,
  taxonomyTerms,
} from "@/db/schema";
import type { PublicTaxonomyTerm } from "@/lib/public/presentation";

type ContentKind = "article" | "tutorial";

export type PublicTaxonomyGroup = PublicTaxonomyTerm;
type TaxonomyScope = "content" | "agent" | "prompt" | "skill";

export type PublicLinkRecord = {
  id: string;
  title: string;
  href: string;
  meta: string | null;
};

export type PublicSearchResult = PublicLinkRecord & {
  kind: "article" | "tutorial" | "agent" | "prompt" | "skill";
};

export type HomeRecentUpdate = {
  label: "article" | "tutorial" | "agent" | "prompt" | "skill";
  title: string;
  href: string;
  note: string;
  updatedAt: Date;
};

export type PublicContentRecord = {
  id: string;
  kind: ContentKind;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string | null;
  subtype: string | null;
  publishedAt: Date | null;
  scheduledFor: Date | null;
  heroImageUrl: string | null;
  canonicalUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
};

export type PublicEntityRecord = {
  id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  longDescription?: string | null;
  promptBody?: string | null;
  fullDescription?: string | null;
  providerCompatibility?: string | null;
  variablesSchema?: string | null;
  exampleOutput?: string | null;
  websiteUrl?: string | null;
  githubUrl?: string | null;
  pricingNotes?: string | null;
  updatedAt: Date;
};

export type PublicContentDetail = PublicContentRecord & {
  taxonomy: PublicTaxonomyTerm[];
  relatedAgents: PublicLinkRecord[];
  relatedPrompts: PublicLinkRecord[];
  relatedSkills: PublicLinkRecord[];
};

export type PublicAgentDetail = PublicEntityRecord & {
  longDescription: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  pricingNotes: string | null;
  taxonomy: PublicTaxonomyTerm[];
  relatedPrompts: PublicLinkRecord[];
  relatedSkills: PublicLinkRecord[];
  relatedContent: PublicLinkRecord[];
};

export type PublicPromptDetail = PublicEntityRecord & {
  fullDescription: string | null;
  promptBody: string;
  providerCompatibility: string | null;
  variablesSchema: string | null;
  exampleOutput: string | null;
  taxonomy: PublicTaxonomyTerm[];
  relatedAgents: PublicLinkRecord[];
  relatedSkills: PublicLinkRecord[];
  relatedContent: PublicLinkRecord[];
};

export type PublicSkillDetail = PublicEntityRecord & {
  longDescription: string | null;
  websiteUrl: string | null;
  githubUrl: string | null;
  taxonomy: PublicTaxonomyTerm[];
  relatedAgents: PublicLinkRecord[];
  relatedPrompts: PublicLinkRecord[];
  relatedContent: PublicLinkRecord[];
};

function mapContentHref(kind: ContentKind, slug: string) {
  return kind === "article" ? `/articles/${slug}` : `/tutorials/${slug}`;
}

function mapEntityHref(kind: "agent" | "prompt" | "skill", slug: string) {
  if (kind === "agent") return `/agents/${slug}`;
  if (kind === "prompt") return `/prompts/${slug}`;
  return `/skills/${slug}`;
}

async function loadTaxonomyTermsByIds(ids: string[]) {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: taxonomyTerms.id,
      label: taxonomyTerms.label,
      slug: taxonomyTerms.slug,
      kind: taxonomyTerms.kind,
      scope: taxonomyTerms.scope,
    })
    .from(taxonomyTerms)
    .where(inArray(taxonomyTerms.id, ids));

  return rows;
}

async function loadPublishedAgentsByIds(ids: string[]): Promise<PublicLinkRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: agents.id,
      title: agents.title,
      slug: agents.slug,
      meta: agents.shortDescription,
    })
    .from(agents)
    .where(and(inArray(agents.id, ids), eq(agents.status, "published")))
    .orderBy(agents.title);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: mapEntityHref("agent", row.slug),
    meta: row.meta,
  }));
}

async function loadPublishedPromptsByIds(ids: string[]): Promise<PublicLinkRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      meta: prompts.shortDescription,
    })
    .from(prompts)
    .where(and(inArray(prompts.id, ids), eq(prompts.status, "published")))
    .orderBy(prompts.title);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: mapEntityHref("prompt", row.slug),
    meta: row.meta,
  }));
}

async function loadPublishedSkillsByIds(ids: string[]): Promise<PublicLinkRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: skills.id,
      title: skills.title,
      slug: skills.slug,
      meta: skills.shortDescription,
    })
    .from(skills)
    .where(and(inArray(skills.id, ids), eq(skills.status, "published")))
    .orderBy(skills.title);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: mapEntityHref("skill", row.slug),
    meta: row.meta,
  }));
}

async function loadPublishedContentByIds(ids: string[]): Promise<PublicLinkRecord[]> {
  if (ids.length === 0) {
    return [];
  }

  const rows = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      kind: contentItems.kind,
      meta: contentItems.excerpt,
    })
    .from(contentItems)
    .where(and(inArray(contentItems.id, ids), eq(contentItems.status, "published")))
    .orderBy(desc(contentItems.publishedAt), desc(contentItems.updatedAt));

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    href: mapContentHref(row.kind, row.slug),
    meta: row.meta ?? row.kind,
  }));
}

export async function listTaxonomyTermsByScope(
  scope: TaxonomyScope,
): Promise<PublicTaxonomyTerm[]> {
  return db
    .select({
      id: taxonomyTerms.id,
      label: taxonomyTerms.label,
      slug: taxonomyTerms.slug,
      kind: taxonomyTerms.kind,
      scope: taxonomyTerms.scope,
    })
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.scope, scope))
    .orderBy(taxonomyTerms.kind, taxonomyTerms.label);
}

export async function listPublishedContent(
  kind: ContentKind,
  taxonomySlug?: string,
): Promise<PublicContentRecord[]> {
  const baseQuery = db
    .select({
      id: contentItems.id,
      kind: contentItems.kind,
      title: contentItems.title,
      slug: contentItems.slug,
      excerpt: contentItems.excerpt,
      body: contentItems.body,
      subtype: contentItems.subtype,
      publishedAt: contentItems.publishedAt,
      scheduledFor: contentItems.scheduledFor,
      heroImageUrl: contentItems.heroImageUrl,
      canonicalUrl: contentItems.canonicalUrl,
      seoTitle: contentItems.seoTitle,
      seoDescription: contentItems.seoDescription,
      updatedAt: contentItems.updatedAt,
    })
    .from(contentItems);

  if (!taxonomySlug) {
    return baseQuery
      .where(and(eq(contentItems.kind, kind), eq(contentItems.status, "published")))
      .orderBy(desc(contentItems.publishedAt), desc(contentItems.updatedAt));
  }

  return baseQuery
    .innerJoin(
      contentTaxonomyTerms,
      eq(contentTaxonomyTerms.contentItemId, contentItems.id),
    )
    .innerJoin(
      taxonomyTerms,
      eq(taxonomyTerms.id, contentTaxonomyTerms.taxonomyTermId),
    )
    .where(
      and(
        eq(contentItems.kind, kind),
        eq(contentItems.status, "published"),
        eq(taxonomyTerms.scope, "content"),
        eq(taxonomyTerms.slug, taxonomySlug),
      ),
    )
    .orderBy(desc(contentItems.publishedAt), desc(contentItems.updatedAt));
}

export async function listPublishedAgents(
  taxonomySlug?: string,
): Promise<PublicEntityRecord[]> {
  const baseQuery = db
    .select({
      id: agents.id,
      title: agents.title,
      slug: agents.slug,
      shortDescription: agents.shortDescription,
      longDescription: agents.longDescription,
      websiteUrl: agents.websiteUrl,
      githubUrl: agents.githubUrl,
      pricingNotes: agents.pricingNotes,
      updatedAt: agents.updatedAt,
    })
    .from(agents);

  if (!taxonomySlug) {
    return baseQuery
      .where(eq(agents.status, "published"))
      .orderBy(desc(agents.lastVerifiedAt), desc(agents.updatedAt));
  }

  return baseQuery
    .innerJoin(agentTaxonomyTerms, eq(agentTaxonomyTerms.agentId, agents.id))
    .innerJoin(
      taxonomyTerms,
      eq(taxonomyTerms.id, agentTaxonomyTerms.taxonomyTermId),
    )
    .where(
      and(
        eq(agents.status, "published"),
        eq(taxonomyTerms.scope, "agent"),
        eq(taxonomyTerms.slug, taxonomySlug),
      ),
    )
    .orderBy(desc(agents.lastVerifiedAt), desc(agents.updatedAt));
}

export async function listPublishedPrompts(
  taxonomySlug?: string,
): Promise<PublicEntityRecord[]> {
  const baseQuery = db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      shortDescription: prompts.shortDescription,
      fullDescription: prompts.fullDescription,
      promptBody: prompts.promptBody,
      providerCompatibility: prompts.providerCompatibility,
      variablesSchema: prompts.variablesSchema,
      exampleOutput: prompts.exampleOutput,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts);

  if (!taxonomySlug) {
    return baseQuery
      .where(eq(prompts.status, "published"))
      .orderBy(desc(prompts.updatedAt));
  }

  return baseQuery
    .innerJoin(promptTaxonomyTerms, eq(promptTaxonomyTerms.promptId, prompts.id))
    .innerJoin(
      taxonomyTerms,
      eq(taxonomyTerms.id, promptTaxonomyTerms.taxonomyTermId),
    )
    .where(
      and(
        eq(prompts.status, "published"),
        eq(taxonomyTerms.scope, "prompt"),
        eq(taxonomyTerms.slug, taxonomySlug),
      ),
    )
    .orderBy(desc(prompts.updatedAt));
}

export async function listPublishedSkills(
  taxonomySlug?: string,
): Promise<PublicEntityRecord[]> {
  const baseQuery = db
    .select({
      id: skills.id,
      title: skills.title,
      slug: skills.slug,
      shortDescription: skills.shortDescription,
      longDescription: skills.longDescription,
      websiteUrl: skills.websiteUrl,
      githubUrl: skills.githubUrl,
      updatedAt: skills.updatedAt,
    })
    .from(skills);

  if (!taxonomySlug) {
    return baseQuery
      .where(eq(skills.status, "published"))
      .orderBy(desc(skills.updatedAt));
  }

  return baseQuery
    .innerJoin(skillTaxonomyTerms, eq(skillTaxonomyTerms.skillId, skills.id))
    .innerJoin(
      taxonomyTerms,
      eq(taxonomyTerms.id, skillTaxonomyTerms.taxonomyTermId),
    )
    .where(
      and(
        eq(skills.status, "published"),
        eq(taxonomyTerms.scope, "skill"),
        eq(taxonomyTerms.slug, taxonomySlug),
      ),
    )
    .orderBy(desc(skills.updatedAt));
}

export async function getPublishedContentDetail(
  kind: ContentKind,
  slug: string,
): Promise<PublicContentDetail | null> {
  const [record] = await db
    .select({
      id: contentItems.id,
      kind: contentItems.kind,
      title: contentItems.title,
      slug: contentItems.slug,
      excerpt: contentItems.excerpt,
      body: contentItems.body,
      subtype: contentItems.subtype,
      publishedAt: contentItems.publishedAt,
      scheduledFor: contentItems.scheduledFor,
      heroImageUrl: contentItems.heroImageUrl,
      canonicalUrl: contentItems.canonicalUrl,
      seoTitle: contentItems.seoTitle,
      seoDescription: contentItems.seoDescription,
      updatedAt: contentItems.updatedAt,
    })
    .from(contentItems)
    .where(
      and(
        eq(contentItems.kind, kind),
        eq(contentItems.slug, slug),
        eq(contentItems.status, "published"),
      ),
    )
    .limit(1);

  if (!record) {
    return null;
  }

  const [taxonomyJoinRows, agentJoinRows, promptJoinRows, skillJoinRows] =
    await Promise.all([
      db
        .select({ taxonomyTermId: contentTaxonomyTerms.taxonomyTermId })
        .from(contentTaxonomyTerms)
        .where(eq(contentTaxonomyTerms.contentItemId, record.id)),
      db
        .select({ agentId: contentAgents.agentId })
        .from(contentAgents)
        .where(eq(contentAgents.contentItemId, record.id)),
      db
        .select({ promptId: contentPrompts.promptId })
        .from(contentPrompts)
        .where(eq(contentPrompts.contentItemId, record.id)),
      db
        .select({ skillId: contentSkills.skillId })
        .from(contentSkills)
        .where(eq(contentSkills.contentItemId, record.id)),
    ]);

  const [taxonomy, relatedAgents, relatedPrompts, relatedSkills] = await Promise.all([
    loadTaxonomyTermsByIds(taxonomyJoinRows.map((row) => row.taxonomyTermId)),
    loadPublishedAgentsByIds(agentJoinRows.map((row) => row.agentId)),
    loadPublishedPromptsByIds(promptJoinRows.map((row) => row.promptId)),
    loadPublishedSkillsByIds(skillJoinRows.map((row) => row.skillId)),
  ]);

  return {
    ...record,
    taxonomy,
    relatedAgents,
    relatedPrompts,
    relatedSkills,
  };
}

export async function getPublishedAgentDetail(slug: string): Promise<PublicAgentDetail | null> {
  const [record] = await db
    .select({
      id: agents.id,
      title: agents.title,
      slug: agents.slug,
      shortDescription: agents.shortDescription,
      longDescription: agents.longDescription,
      websiteUrl: agents.websiteUrl,
      githubUrl: agents.githubUrl,
      pricingNotes: agents.pricingNotes,
      updatedAt: agents.updatedAt,
    })
    .from(agents)
    .where(and(eq(agents.slug, slug), eq(agents.status, "published")))
    .limit(1);

  if (!record) {
    return null;
  }

  const [taxonomyJoinRows, promptJoinRows, skillJoinRows, contentJoinRows] =
    await Promise.all([
      db
        .select({ taxonomyTermId: agentTaxonomyTerms.taxonomyTermId })
        .from(agentTaxonomyTerms)
        .where(eq(agentTaxonomyTerms.agentId, record.id)),
      db
        .select({ promptId: agentPrompts.promptId })
        .from(agentPrompts)
        .where(eq(agentPrompts.agentId, record.id)),
      db
        .select({ skillId: agentSkills.skillId })
        .from(agentSkills)
        .where(eq(agentSkills.agentId, record.id)),
      db
        .select({ contentItemId: contentAgents.contentItemId })
        .from(contentAgents)
        .where(eq(contentAgents.agentId, record.id)),
    ]);

  const [taxonomy, relatedPrompts, relatedSkills, relatedContent] = await Promise.all([
    loadTaxonomyTermsByIds(taxonomyJoinRows.map((row) => row.taxonomyTermId)),
    loadPublishedPromptsByIds(promptJoinRows.map((row) => row.promptId)),
    loadPublishedSkillsByIds(skillJoinRows.map((row) => row.skillId)),
    loadPublishedContentByIds(contentJoinRows.map((row) => row.contentItemId)),
  ]);

  return {
    ...record,
    taxonomy,
    relatedPrompts,
    relatedSkills,
    relatedContent,
  };
}

export async function getPublishedPromptDetail(
  slug: string,
): Promise<PublicPromptDetail | null> {
  const [record] = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      shortDescription: prompts.shortDescription,
      fullDescription: prompts.fullDescription,
      promptBody: prompts.promptBody,
      providerCompatibility: prompts.providerCompatibility,
      variablesSchema: prompts.variablesSchema,
      exampleOutput: prompts.exampleOutput,
      updatedAt: prompts.updatedAt,
    })
    .from(prompts)
    .where(and(eq(prompts.slug, slug), eq(prompts.status, "published")))
    .limit(1);

  if (!record) {
    return null;
  }

  const [taxonomyJoinRows, agentJoinRows, skillJoinRows, contentJoinRows] =
    await Promise.all([
      db
        .select({ taxonomyTermId: promptTaxonomyTerms.taxonomyTermId })
        .from(promptTaxonomyTerms)
        .where(eq(promptTaxonomyTerms.promptId, record.id)),
      db
        .select({ agentId: agentPrompts.agentId })
        .from(agentPrompts)
        .where(eq(agentPrompts.promptId, record.id)),
      db
        .select({ skillId: skillPrompts.skillId })
        .from(skillPrompts)
        .where(eq(skillPrompts.promptId, record.id)),
      db
        .select({ contentItemId: contentPrompts.contentItemId })
        .from(contentPrompts)
        .where(eq(contentPrompts.promptId, record.id)),
    ]);

  const [taxonomy, relatedAgents, relatedSkills, relatedContent] = await Promise.all([
    loadTaxonomyTermsByIds(taxonomyJoinRows.map((row) => row.taxonomyTermId)),
    loadPublishedAgentsByIds(agentJoinRows.map((row) => row.agentId)),
    loadPublishedSkillsByIds(skillJoinRows.map((row) => row.skillId)),
    loadPublishedContentByIds(contentJoinRows.map((row) => row.contentItemId)),
  ]);

  return {
    ...record,
    taxonomy,
    relatedAgents,
    relatedSkills,
    relatedContent,
  };
}

export async function getPublishedSkillDetail(slug: string): Promise<PublicSkillDetail | null> {
  const [record] = await db
    .select({
      id: skills.id,
      title: skills.title,
      slug: skills.slug,
      shortDescription: skills.shortDescription,
      longDescription: skills.longDescription,
      websiteUrl: skills.websiteUrl,
      githubUrl: skills.githubUrl,
      updatedAt: skills.updatedAt,
    })
    .from(skills)
    .where(and(eq(skills.slug, slug), eq(skills.status, "published")))
    .limit(1);

  if (!record) {
    return null;
  }

  const [taxonomyJoinRows, agentJoinRows, promptJoinRows, contentJoinRows] =
    await Promise.all([
      db
        .select({ taxonomyTermId: skillTaxonomyTerms.taxonomyTermId })
        .from(skillTaxonomyTerms)
        .where(eq(skillTaxonomyTerms.skillId, record.id)),
      db
        .select({ agentId: agentSkills.agentId })
        .from(agentSkills)
        .where(eq(agentSkills.skillId, record.id)),
      db
        .select({ promptId: skillPrompts.promptId })
        .from(skillPrompts)
        .where(eq(skillPrompts.skillId, record.id)),
      db
        .select({ contentItemId: contentSkills.contentItemId })
        .from(contentSkills)
        .where(eq(contentSkills.skillId, record.id)),
    ]);

  const [taxonomy, relatedAgents, relatedPrompts, relatedContent] = await Promise.all([
    loadTaxonomyTermsByIds(taxonomyJoinRows.map((row) => row.taxonomyTermId)),
    loadPublishedAgentsByIds(agentJoinRows.map((row) => row.agentId)),
    loadPublishedPromptsByIds(promptJoinRows.map((row) => row.promptId)),
    loadPublishedContentByIds(contentJoinRows.map((row) => row.contentItemId)),
  ]);

  return {
    ...record,
    taxonomy,
    relatedAgents,
    relatedPrompts,
    relatedContent,
  };
}

export async function searchPublishedGraph(query: string): Promise<PublicSearchResult[]> {
  const trimmedQuery = query.trim();

  if (!trimmedQuery) {
    return [];
  }

  const pattern = `%${trimmedQuery}%`;
  const [contentRows, agentRows, promptRows, skillRows] = await Promise.all([
    db
      .select({
        id: contentItems.id,
        title: contentItems.title,
        slug: contentItems.slug,
        kind: contentItems.kind,
        meta: contentItems.excerpt,
      })
      .from(contentItems)
      .where(
        and(
          eq(contentItems.status, "published"),
          or(ilike(contentItems.title, pattern), ilike(contentItems.excerpt, pattern)),
        ),
      )
      .orderBy(desc(contentItems.publishedAt), desc(contentItems.updatedAt))
      .limit(10),
    db
      .select({
        id: agents.id,
        title: agents.title,
        slug: agents.slug,
        meta: agents.shortDescription,
      })
      .from(agents)
      .where(
        and(
          eq(agents.status, "published"),
          or(ilike(agents.title, pattern), ilike(agents.shortDescription, pattern)),
        ),
      )
      .orderBy(desc(agents.updatedAt))
      .limit(10),
    db
      .select({
        id: prompts.id,
        title: prompts.title,
        slug: prompts.slug,
        meta: prompts.shortDescription,
      })
      .from(prompts)
      .where(
        and(
          eq(prompts.status, "published"),
          or(
            ilike(prompts.title, pattern),
            ilike(prompts.shortDescription, pattern),
            ilike(prompts.promptBody, pattern),
          ),
        ),
      )
      .orderBy(desc(prompts.updatedAt))
      .limit(10),
    db
      .select({
        id: skills.id,
        title: skills.title,
        slug: skills.slug,
        meta: skills.shortDescription,
      })
      .from(skills)
      .where(
        and(
          eq(skills.status, "published"),
          or(ilike(skills.title, pattern), ilike(skills.shortDescription, pattern)),
        ),
      )
      .orderBy(desc(skills.updatedAt))
      .limit(10),
  ]);

  return [
    ...contentRows.map((row) => ({
      id: row.id,
      title: row.title,
      href: mapContentHref(row.kind, row.slug),
      meta: row.meta ?? row.kind,
      kind: row.kind,
    })),
    ...agentRows.map((row) => ({
      id: row.id,
      title: row.title,
      href: mapEntityHref("agent", row.slug),
      meta: row.meta,
      kind: "agent" as const,
    })),
    ...promptRows.map((row) => ({
      id: row.id,
      title: row.title,
      href: mapEntityHref("prompt", row.slug),
      meta: row.meta,
      kind: "prompt" as const,
    })),
    ...skillRows.map((row) => ({
      id: row.id,
      title: row.title,
      href: mapEntityHref("skill", row.slug),
      meta: row.meta,
      kind: "skill" as const,
    })),
  ];
}

export async function getHomepageSnapshot() {
  const [articles, tutorials, agentsList, promptsList, skillsList, termRows] =
    await Promise.all([
      listPublishedContent("article"),
      listPublishedContent("tutorial"),
      listPublishedAgents(),
      listPublishedPrompts(),
      listPublishedSkills(),
      db
        .select({
          id: taxonomyTerms.id,
          label: taxonomyTerms.label,
          slug: taxonomyTerms.slug,
          kind: taxonomyTerms.kind,
          scope: taxonomyTerms.scope,
        })
        .from(taxonomyTerms)
        .orderBy(desc(taxonomyTerms.updatedAt))
        .limit(6),
    ]);

  const recentUpdates: HomeRecentUpdate[] = [
    ...articles.map((item) => ({
      label: "article" as const,
      title: item.title,
      href: mapContentHref("article", item.slug),
      note: item.excerpt ?? "New article on AgentRiot",
      updatedAt: item.updatedAt,
    })),
    ...tutorials.map((item) => ({
      label: "tutorial" as const,
      title: item.title,
      href: mapContentHref("tutorial", item.slug),
      note: item.excerpt ?? "New tutorial on AgentRiot",
      updatedAt: item.updatedAt,
    })),
    ...agentsList.map((item) => ({
      label: "agent" as const,
      title: item.title,
      href: mapEntityHref("agent", item.slug),
      note: item.shortDescription ?? "Agent on AgentRiot",
      updatedAt: item.updatedAt,
    })),
    ...promptsList.map((item) => ({
      label: "prompt" as const,
      title: item.title,
      href: mapEntityHref("prompt", item.slug),
      note: item.shortDescription ?? "Prompt on AgentRiot",
      updatedAt: item.updatedAt,
    })),
    ...skillsList.map((item) => ({
      label: "skill" as const,
      title: item.title,
      href: mapEntityHref("skill", item.slug),
      note: item.shortDescription ?? "Skill on AgentRiot",
      updatedAt: item.updatedAt,
    })),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 6);

  return {
    leadStory: articles[0] ?? tutorials[0] ?? null,
    modelNews: articles
      .filter((item) => item.subtype === "news" || item.subtype === "release-note")
      .slice(0, 2),
    featuredAgents: agentsList.slice(0, 3),
    featuredPrompts: promptsList.slice(0, 4),
    featuredSkills: skillsList.slice(0, 4),
    featuredStories: [...tutorials.slice(0, 2), ...articles.slice(0, 2)].slice(0, 4),
    trendingTerms: termRows,
    recentUpdates,
  };
}
