import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  agentTaxonomyTerms,
  agents,
  apiKeys,
  agentPrompts,
  agentSkills,
  contentAgents,
  contentItems,
  contentRevisions,
  contentPrompts,
  contentSkills,
  contentTaxonomyTerms,
  prompts,
  promptTaxonomyTerms,
  skillPrompts,
  skillTaxonomyTerms,
  skills,
  type publicationStatusEnum,
  taxonomyKindEnum,
  taxonomyScopeEnum,
  taxonomyTerms,
} from "@/db/schema";
import {
  nextAvailableSlug,
  nextAvailableSlugExcept,
} from "@/lib/content/slug-policy";

type Status = (typeof publicationStatusEnum.enumValues)[number];
type TaxonomyScope = (typeof taxonomyScopeEnum.enumValues)[number];
type TaxonomyKind = (typeof taxonomyKindEnum.enumValues)[number];

export type AdminEntitySummary = {
  id: string;
  title: string;
  slug: string;
  status: string;
  updatedAt: Date;
  meta: string | null;
  href: string;
};

export type RelationOption = {
  id: string;
  title: string;
  meta: string | null;
};

export type AdminContentRecord = typeof contentItems.$inferSelect;
export type AdminAgentRecord = typeof agents.$inferSelect;
export type AdminPromptRecord = typeof prompts.$inferSelect;
export type AdminSkillRecord = typeof skills.$inferSelect;
export type AdminTaxonomyRecord = typeof taxonomyTerms.$inferSelect;
export type AdminContentRevisionRecord = typeof contentRevisions.$inferSelect;
export type AdminApiKeyRecord = typeof apiKeys.$inferSelect;

export async function getDashboardCounts() {
  const [contentCount, agentCount, promptCount, skillCount] = await Promise.all([
    db.$count(contentItems),
    db.$count(agents),
    db.$count(prompts),
    db.$count(skills),
  ]);

  return {
    contentCount,
    agentCount,
    promptCount,
    skillCount,
  };
}

export async function listContentItems(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: contentItems.id,
      title: contentItems.title,
      slug: contentItems.slug,
      status: contentItems.status,
      updatedAt: contentItems.updatedAt,
      meta: contentItems.kind,
    })
    .from(contentItems)
    .orderBy(desc(contentItems.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    href: `/admin/content/${row.id}`,
  }));
}

export async function listAgents(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: agents.id,
      title: agents.title,
      slug: agents.slug,
      status: agents.status,
      updatedAt: agents.updatedAt,
      meta: agents.shortDescription,
    })
    .from(agents)
    .orderBy(desc(agents.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    href: `/admin/agents/${row.id}`,
  }));
}

export async function listPrompts(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: prompts.id,
      title: prompts.title,
      slug: prompts.slug,
      status: prompts.status,
      updatedAt: prompts.updatedAt,
      meta: prompts.shortDescription,
    })
    .from(prompts)
    .orderBy(desc(prompts.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    href: `/admin/prompts/${row.id}`,
  }));
}

export async function listSkills(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: skills.id,
      title: skills.title,
      slug: skills.slug,
      status: skills.status,
      updatedAt: skills.updatedAt,
      meta: skills.shortDescription,
    })
    .from(skills)
    .orderBy(desc(skills.updatedAt))
    .limit(50);

  return rows.map((row) => ({
    ...row,
    href: `/admin/skills/${row.id}`,
  }));
}

export async function listTaxonomyTerms(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: taxonomyTerms.id,
      title: taxonomyTerms.label,
      slug: taxonomyTerms.slug,
      status: taxonomyTerms.kind,
      scope: taxonomyTerms.scope,
      updatedAt: taxonomyTerms.updatedAt,
      meta: taxonomyTerms.description,
    })
    .from(taxonomyTerms)
    .orderBy(taxonomyTerms.scope, taxonomyTerms.kind, taxonomyTerms.label)
    .limit(100);

  return rows.map((row) => ({
    ...row,
    meta: row.meta
      ? `${row.scope} · ${row.status} · ${row.meta}`
      : `${row.scope} · ${row.status}`,
    href: `/admin/taxonomy/${row.id}`,
  }));
}

export async function listApiKeys(): Promise<AdminEntitySummary[]> {
  const rows = await db
    .select({
      id: apiKeys.id,
      title: apiKeys.label,
      slug: apiKeys.keyPrefix,
      updatedAt: apiKeys.updatedAt,
      revokedAt: apiKeys.revokedAt,
      expiresAt: apiKeys.expiresAt,
      meta: apiKeys.description,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt))
    .limit(100);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    status: row.revokedAt
      ? "revoked"
      : row.expiresAt && row.expiresAt.getTime() <= Date.now()
        ? "expired"
        : "active",
    updatedAt: row.updatedAt,
    meta: row.meta,
    href: `/admin/api-keys/${row.id}`,
  }));
}

export async function ensureUniqueContentSlug(slug: string, kind: "article" | "tutorial") {
  const existing = await db
    .select({ slug: contentItems.slug })
    .from(contentItems)
    .where(eq(contentItems.kind, kind));

  return nextAvailableSlug(
    slug,
    existing.map((row) => row.slug),
  );
}

export async function ensureUniqueContentSlugForUpdate(
  slug: string,
  kind: "article" | "tutorial",
  currentSlug: string,
) {
  const existing = await db
    .select({ slug: contentItems.slug })
    .from(contentItems)
    .where(eq(contentItems.kind, kind));

  return nextAvailableSlugExcept(
    slug,
    existing.map((row) => row.slug),
    currentSlug,
  );
}

export async function ensureUniqueAgentSlug(slug: string) {
  const existing = await db.select({ slug: agents.slug }).from(agents);
  return nextAvailableSlug(
    slug,
    existing.map((row) => row.slug),
  );
}

export async function ensureUniqueAgentSlugForUpdate(
  slug: string,
  currentSlug: string,
) {
  const existing = await db.select({ slug: agents.slug }).from(agents);
  return nextAvailableSlugExcept(
    slug,
    existing.map((row) => row.slug),
    currentSlug,
  );
}

export async function ensureUniquePromptSlug(slug: string) {
  const existing = await db.select({ slug: prompts.slug }).from(prompts);
  return nextAvailableSlug(
    slug,
    existing.map((row) => row.slug),
  );
}

export async function ensureUniquePromptSlugForUpdate(
  slug: string,
  currentSlug: string,
) {
  const existing = await db.select({ slug: prompts.slug }).from(prompts);
  return nextAvailableSlugExcept(
    slug,
    existing.map((row) => row.slug),
    currentSlug,
  );
}

export async function ensureUniqueSkillSlug(slug: string) {
  const existing = await db.select({ slug: skills.slug }).from(skills);
  return nextAvailableSlug(
    slug,
    existing.map((row) => row.slug),
  );
}

export async function ensureUniqueSkillSlugForUpdate(
  slug: string,
  currentSlug: string,
) {
  const existing = await db.select({ slug: skills.slug }).from(skills);
  return nextAvailableSlugExcept(
    slug,
    existing.map((row) => row.slug),
    currentSlug,
  );
}

export async function ensureUniqueTaxonomySlug(
  scope: TaxonomyScope,
  kind: TaxonomyKind,
  slug: string,
) {
  const existing = await db
    .select({ slug: taxonomyTerms.slug })
    .from(taxonomyTerms)
    .where(and(eq(taxonomyTerms.scope, scope), eq(taxonomyTerms.kind, kind)));

  return nextAvailableSlug(
    slug,
    existing.map((row) => row.slug),
  );
}

export async function ensureUniqueTaxonomySlugForUpdate(
  scope: TaxonomyScope,
  kind: TaxonomyKind,
  slug: string,
  currentSlug: string,
) {
  const existing = await db
    .select({ slug: taxonomyTerms.slug })
    .from(taxonomyTerms)
    .where(and(eq(taxonomyTerms.scope, scope), eq(taxonomyTerms.kind, kind)));

  return nextAvailableSlugExcept(
    slug,
    existing.map((row) => row.slug),
    currentSlug,
  );
}

export async function getContentItemById(id: string) {
  const [record] = await db
    .select()
    .from(contentItems)
    .where(eq(contentItems.id, id))
    .limit(1);

  return record ?? null;
}

export async function listContentRevisions(contentItemId: string) {
  return db
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.contentItemId, contentItemId))
    .orderBy(desc(contentRevisions.revisionNumber), desc(contentRevisions.createdAt))
    .limit(20);
}

export async function getAgentById(id: string) {
  const [record] = await db.select().from(agents).where(eq(agents.id, id)).limit(1);

  return record ?? null;
}

export async function getPromptById(id: string) {
  const [record] = await db
    .select()
    .from(prompts)
    .where(eq(prompts.id, id))
    .limit(1);

  return record ?? null;
}

export async function getSkillById(id: string) {
  const [record] = await db.select().from(skills).where(eq(skills.id, id)).limit(1);

  return record ?? null;
}

export async function getTaxonomyTermById(id: string) {
  const [record] = await db
    .select()
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.id, id))
    .limit(1);

  return record ?? null;
}

export async function getApiKeyById(id: string) {
  const [record] = await db
    .select()
    .from(apiKeys)
    .where(eq(apiKeys.id, id))
    .limit(1);

  return record ?? null;
}

export async function listAgentOptions(): Promise<RelationOption[]> {
  return db
    .select({
      id: agents.id,
      title: agents.title,
      meta: agents.slug,
    })
    .from(agents)
    .orderBy(agents.title);
}

export async function listPromptOptions(): Promise<RelationOption[]> {
  return db
    .select({
      id: prompts.id,
      title: prompts.title,
      meta: prompts.slug,
    })
    .from(prompts)
    .orderBy(prompts.title);
}

export async function listSkillOptions(): Promise<RelationOption[]> {
  return db
    .select({
      id: skills.id,
      title: skills.title,
      meta: skills.slug,
    })
    .from(skills)
    .orderBy(skills.title);
}

export async function listTaxonomyOptionsByScope(
  scope: TaxonomyScope,
): Promise<RelationOption[]> {
  return db
    .select({
      id: taxonomyTerms.id,
      title: taxonomyTerms.label,
      meta: taxonomyTerms.kind,
    })
    .from(taxonomyTerms)
    .where(eq(taxonomyTerms.scope, scope))
    .orderBy(taxonomyTerms.kind, taxonomyTerms.label);
}

export async function getContentRelationIds(id: string) {
  const [agentRows, promptRows, skillRows] = await Promise.all([
    db
      .select({ relatedId: contentAgents.agentId })
      .from(contentAgents)
      .where(eq(contentAgents.contentItemId, id)),
    db
      .select({ relatedId: contentPrompts.promptId })
      .from(contentPrompts)
      .where(eq(contentPrompts.contentItemId, id)),
    db
      .select({ relatedId: contentSkills.skillId })
      .from(contentSkills)
      .where(eq(contentSkills.contentItemId, id)),
  ]);

  return {
    agentIds: agentRows.map((row) => row.relatedId),
    promptIds: promptRows.map((row) => row.relatedId),
    skillIds: skillRows.map((row) => row.relatedId),
  };
}

export async function getContentTaxonomyIds(id: string) {
  const rows = await db
    .select({ relatedId: contentTaxonomyTerms.taxonomyTermId })
    .from(contentTaxonomyTerms)
    .where(eq(contentTaxonomyTerms.contentItemId, id));

  return rows.map((row) => row.relatedId);
}

export async function getAgentRelationIds(id: string) {
  const [promptRows, skillRows] = await Promise.all([
    db
      .select({ relatedId: agentPrompts.promptId })
      .from(agentPrompts)
      .where(eq(agentPrompts.agentId, id)),
    db
      .select({ relatedId: agentSkills.skillId })
      .from(agentSkills)
      .where(eq(agentSkills.agentId, id)),
  ]);

  return {
    promptIds: promptRows.map((row) => row.relatedId),
    skillIds: skillRows.map((row) => row.relatedId),
  };
}

export async function getAgentTaxonomyIds(id: string) {
  const rows = await db
    .select({ relatedId: agentTaxonomyTerms.taxonomyTermId })
    .from(agentTaxonomyTerms)
    .where(eq(agentTaxonomyTerms.agentId, id));

  return rows.map((row) => row.relatedId);
}

export async function getPromptRelationIds(id: string) {
  const [agentRows, skillRows] = await Promise.all([
    db
      .select({ relatedId: agentPrompts.agentId })
      .from(agentPrompts)
      .where(eq(agentPrompts.promptId, id)),
    db
      .select({ relatedId: skillPrompts.skillId })
      .from(skillPrompts)
      .where(eq(skillPrompts.promptId, id)),
  ]);

  return {
    agentIds: agentRows.map((row) => row.relatedId),
    skillIds: skillRows.map((row) => row.relatedId),
  };
}

export async function getPromptTaxonomyIds(id: string) {
  const rows = await db
    .select({ relatedId: promptTaxonomyTerms.taxonomyTermId })
    .from(promptTaxonomyTerms)
    .where(eq(promptTaxonomyTerms.promptId, id));

  return rows.map((row) => row.relatedId);
}

export async function getSkillRelationIds(id: string) {
  const [agentRows, promptRows] = await Promise.all([
    db
      .select({ relatedId: agentSkills.agentId })
      .from(agentSkills)
      .where(eq(agentSkills.skillId, id)),
    db
      .select({ relatedId: skillPrompts.promptId })
      .from(skillPrompts)
      .where(eq(skillPrompts.skillId, id)),
  ]);

  return {
    agentIds: agentRows.map((row) => row.relatedId),
    promptIds: promptRows.map((row) => row.relatedId),
  };
}

export async function getSkillTaxonomyIds(id: string) {
  const rows = await db
    .select({ relatedId: skillTaxonomyTerms.taxonomyTermId })
    .from(skillTaxonomyTerms)
    .where(eq(skillTaxonomyTerms.skillId, id));

  return rows.map((row) => row.relatedId);
}
