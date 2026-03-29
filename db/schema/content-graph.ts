import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "@/db/schema/auth";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
};

const uuidId = () =>
  uuid("id").default(sql`pg_catalog.gen_random_uuid()`).primaryKey();

export const contentKindEnum = pgEnum("content_kind", ["article", "tutorial"]);
export const contentSubtypeEnum = pgEnum("content_subtype", [
  "news",
  "blog",
  "analysis",
  "roundup",
  "guide",
  "release-note",
]);
export const publicationStatusEnum = pgEnum("publication_status", [
  "draft",
  "review",
  "scheduled",
  "published",
  "archived",
]);
export const taxonomyScopeEnum = pgEnum("taxonomy_scope", [
  "content",
  "agent",
  "prompt",
  "skill",
]);
export const apiKeyScopeEnum = pgEnum("api_key_scope", [
  "content:write",
  "agents:write",
  "skills:write",
  "prompts:write",
  "taxonomy:write",
  "admin:*",
]);
export const taxonomyKindEnum = pgEnum("taxonomy_kind", [
  "category",
  "tag",
  "type",
]);
export const ingestionTargetEnum = pgEnum("ingestion_target", [
  "content",
  "agent",
  "prompt",
  "skill",
  "taxonomy",
]);
export const ingestionStatusEnum = pgEnum("ingestion_status", [
  "accepted",
  "applied",
  "rejected",
]);

export const contentItems = pgTable(
  "content_items",
  {
    id: uuidId(),
    kind: contentKindEnum("kind").notNull(),
    subtype: contentSubtypeEnum("subtype"),
    status: publicationStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    heroImageUrl: text("hero_image_url"),
    canonicalUrl: text("canonical_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("content_items_kind_slug_idx").on(table.kind, table.slug),
    index("content_items_status_idx").on(table.status),
    index("content_items_published_at_idx").on(table.publishedAt),
  ],
);

export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: uuidId(),
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    revisionNumber: integer("revision_number").notNull(),
    kind: contentKindEnum("kind").notNull(),
    subtype: contentSubtypeEnum("subtype"),
    status: publicationStatusEnum("status").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body"),
    heroImageUrl: text("hero_image_url"),
    canonicalUrl: text("canonical_url"),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
    editedById: text("edited_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_revisions_item_revision_idx").on(
      table.contentItemId,
      table.revisionNumber,
    ),
    index("content_revisions_item_created_idx").on(table.contentItemId, table.createdAt),
  ],
);

export const agents = pgTable(
  "agents",
  {
    id: uuidId(),
    status: publicationStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    longDescription: text("long_description"),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    pricingNotes: text("pricing_notes"),
    lastVerifiedAt: timestamp("last_verified_at", { withTimezone: true }),
    isFeatured: boolean("is_featured").notNull().default(false),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("agents_slug_idx").on(table.slug),
    index("agents_status_idx").on(table.status),
    index("agents_last_verified_idx").on(table.lastVerifiedAt),
  ],
);

export const skills = pgTable(
  "skills",
  {
    id: uuidId(),
    status: publicationStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    longDescription: text("long_description"),
    websiteUrl: text("website_url"),
    githubUrl: text("github_url"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("skills_slug_idx").on(table.slug),
    index("skills_status_idx").on(table.status),
  ],
);

export const prompts = pgTable(
  "prompts",
  {
    id: uuidId(),
    status: publicationStatusEnum("status").notNull().default("draft"),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    shortDescription: text("short_description"),
    fullDescription: text("full_description"),
    promptBody: text("prompt_body").notNull(),
    providerCompatibility: text("provider_compatibility"),
    variablesSchema: text("variables_schema"),
    exampleOutput: text("example_output"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    updatedById: text("updated_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("prompts_slug_idx").on(table.slug),
    index("prompts_status_idx").on(table.status),
  ],
);

export const taxonomyTerms = pgTable(
  "taxonomy_terms",
  {
    id: uuidId(),
    scope: taxonomyScopeEnum("scope").notNull(),
    kind: taxonomyKindEnum("kind").notNull(),
    label: text("label").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    sortOrder: integer("sort_order").notNull().default(0),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("taxonomy_terms_scope_kind_slug_idx").on(
      table.scope,
      table.kind,
      table.slug,
    ),
  ],
);

export const redirects = pgTable(
  "redirects",
  {
    id: uuidId(),
    sourcePath: text("source_path").notNull(),
    targetPath: text("target_path").notNull(),
    isPermanent: boolean("is_permanent").notNull().default(true),
    ...timestamps,
  },
  (table) => [uniqueIndex("redirects_source_path_idx").on(table.sourcePath)],
);

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuidId(),
    label: text("label").notNull(),
    keyPrefix: text("key_prefix").notNull(),
    keyHash: text("key_hash").notNull(),
    scopes: apiKeyScopeEnum("scopes").array().notNull(),
    description: text("description"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    lastUsedIp: text("last_used_ip"),
    createdById: text("created_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("api_keys_key_prefix_idx").on(table.keyPrefix),
    index("api_keys_revoked_at_idx").on(table.revokedAt),
    index("api_keys_expires_at_idx").on(table.expiresAt),
  ],
);

export const ingestionEvents = pgTable(
  "ingestion_events",
  {
    id: uuidId(),
    apiKeyId: uuid("api_key_id").references(() => apiKeys.id, {
      onDelete: "set null",
    }),
    target: ingestionTargetEnum("target").notNull(),
    action: text("action").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    externalId: text("external_id"),
    payload: jsonb("payload").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: ingestionStatusEnum("status").notNull().default("accepted"),
    errorMessage: text("error_message"),
    processedAt: timestamp("processed_at", { withTimezone: true }),
    createdRecordId: uuid("created_record_id"),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("ingestion_events_api_key_idempotency_idx").on(
      table.apiKeyId,
      table.idempotencyKey,
    ),
    index("ingestion_events_target_status_idx").on(table.target, table.status),
  ],
);

export const contentTaxonomyTerms = pgTable(
  "content_taxonomy_terms",
  {
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    taxonomyTermId: uuid("taxonomy_term_id")
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.contentItemId, table.taxonomyTermId] }),
  ],
);

export const agentTaxonomyTerms = pgTable(
  "agent_taxonomy_terms",
  {
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    taxonomyTermId: uuid("taxonomy_term_id")
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.taxonomyTermId] })],
);

export const skillTaxonomyTerms = pgTable(
  "skill_taxonomy_terms",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    taxonomyTermId: uuid("taxonomy_term_id")
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.skillId, table.taxonomyTermId] })],
);

export const promptTaxonomyTerms = pgTable(
  "prompt_taxonomy_terms",
  {
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
    taxonomyTermId: uuid("taxonomy_term_id")
      .notNull()
      .references(() => taxonomyTerms.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.promptId, table.taxonomyTermId] })],
);

export const contentAgents = pgTable(
  "content_agents",
  {
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contentItemId, table.agentId] })],
);

export const contentPrompts = pgTable(
  "content_prompts",
  {
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contentItemId, table.promptId] })],
);

export const contentSkills = pgTable(
  "content_skills",
  {
    contentItemId: uuid("content_item_id")
      .notNull()
      .references(() => contentItems.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.contentItemId, table.skillId] })],
);

export const agentPrompts = pgTable(
  "agent_prompts",
  {
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.promptId] })],
);

export const agentSkills = pgTable(
  "agent_skills",
  {
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.agentId, table.skillId] })],
);

export const skillPrompts = pgTable(
  "skill_prompts",
  {
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    promptId: uuid("prompt_id")
      .notNull()
      .references(() => prompts.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.skillId, table.promptId] })],
);

export const contentItemsRelations = relations(contentItems, ({ many, one }) => ({
  createdBy: one(user, {
    fields: [contentItems.createdById],
    references: [user.id],
  }),
  updatedBy: one(user, {
    fields: [contentItems.updatedById],
    references: [user.id],
  }),
  taxonomyTerms: many(contentTaxonomyTerms),
  relatedAgents: many(contentAgents),
  relatedPrompts: many(contentPrompts),
  relatedSkills: many(contentSkills),
  revisions: many(contentRevisions),
}));

export const contentRevisionsRelations = relations(contentRevisions, ({ one }) => ({
  contentItem: one(contentItems, {
    fields: [contentRevisions.contentItemId],
    references: [contentItems.id],
  }),
  editedBy: one(user, {
    fields: [contentRevisions.editedById],
    references: [user.id],
  }),
}));

export const agentsRelations = relations(agents, ({ many, one }) => ({
  createdBy: one(user, {
    fields: [agents.createdById],
    references: [user.id],
  }),
  updatedBy: one(user, {
    fields: [agents.updatedById],
    references: [user.id],
  }),
  taxonomyTerms: many(agentTaxonomyTerms),
  relatedContent: many(contentAgents),
  relatedPrompts: many(agentPrompts),
  relatedSkills: many(agentSkills),
}));

export const skillsRelations = relations(skills, ({ many, one }) => ({
  createdBy: one(user, {
    fields: [skills.createdById],
    references: [user.id],
  }),
  updatedBy: one(user, {
    fields: [skills.updatedById],
    references: [user.id],
  }),
  taxonomyTerms: many(skillTaxonomyTerms),
  relatedContent: many(contentSkills),
  relatedAgents: many(agentSkills),
  relatedPrompts: many(skillPrompts),
}));

export const promptsRelations = relations(prompts, ({ many, one }) => ({
  createdBy: one(user, {
    fields: [prompts.createdById],
    references: [user.id],
  }),
  updatedBy: one(user, {
    fields: [prompts.updatedById],
    references: [user.id],
  }),
  taxonomyTerms: many(promptTaxonomyTerms),
  relatedContent: many(contentPrompts),
  relatedAgents: many(agentPrompts),
  relatedSkills: many(skillPrompts),
}));

export const taxonomyTermsRelations = relations(taxonomyTerms, ({ many }) => ({
  contentItems: many(contentTaxonomyTerms),
  agents: many(agentTaxonomyTerms),
  prompts: many(promptTaxonomyTerms),
  skills: many(skillTaxonomyTerms),
}));

export const apiKeysRelations = relations(apiKeys, ({ one, many }) => ({
  createdBy: one(user, {
    fields: [apiKeys.createdById],
    references: [user.id],
  }),
  ingestionEvents: many(ingestionEvents),
}));

export const ingestionEventsRelations = relations(ingestionEvents, ({ one }) => ({
  apiKey: one(apiKeys, {
    fields: [ingestionEvents.apiKeyId],
    references: [apiKeys.id],
  }),
}));
