import { relations, sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import {
  AGENT_SIGNAL_TYPES,
  AGENT_STATUS_VALUES,
  GLOBAL_FEED_SIGNAL_TYPES,
  MAX_AGENT_UPDATE_SKILLS_TOOLS,
  MODERATION_ACTION_TYPES,
  REDIRECT_TYPES,
  SLUG_PATTERN,
  TAXONOMY_TYPES,
} from "./contracts";

export const agentStatusEnum = pgEnum("agent_status", AGENT_STATUS_VALUES);
export const agentSignalTypeEnum = pgEnum("agent_signal_type", AGENT_SIGNAL_TYPES);
export const moderationActionTypeEnum = pgEnum(
  "moderation_action_type",
  MODERATION_ACTION_TYPES,
);
export const redirectTypeEnum = pgEnum("redirect_type", REDIRECT_TYPES);
export const taxonomyTypeEnum = pgEnum("taxonomy_type", TAXONOMY_TYPES);

const textArrayDefault = sql`'{}'::text[]`;
const uuidArrayDefault = sql`'{}'::uuid[]`;
const jsonArrayDefault = sql`'[]'::jsonb`;
const jsonObjectDefault = sql`'{}'::jsonb`;
const slugPatternSql = sql.raw(`'${SLUG_PATTERN}'`);
const maxAgentUpdateSkillsToolsSql = sql.raw(
  `${MAX_AGENT_UPDATE_SKILLS_TOOLS}`,
);
const globalFeedSignalTypeListSql = sql.raw(
  GLOBAL_FEED_SIGNAL_TYPES.map((signalType) => `'${signalType}'`).join(", "),
);

function createdAtColumn(name = "created_at") {
  return timestamp(name, { withTimezone: true }).notNull().defaultNow();
}

function updatedAtColumn(name = "updated_at") {
  return timestamp(name, { withTimezone: true }).notNull().defaultNow();
}

export const newsArticles = pgTable(
  "news_articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    content: text("content").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    tags: text("tags").array().notNull().default(textArrayDefault),
    featured: boolean("featured").notNull().default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    author: text("author").notNull(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    canonicalUrl: text("canonical_url"),
  },
  (table) => [
    uniqueIndex("news_articles_slug_unique").on(table.slug),
    check("news_articles_slug_format_check", sql`${table.slug} ~ ${slugPatternSql}`),
  ],
);

export const softwareEntries = pgTable(
  "software_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: text("name").notNull(),
    description: text("description").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    tags: text("tags").array().notNull().default(textArrayDefault),
    officialUrl: text("official_url").notNull(),
    githubUrl: text("github_url"),
    docsUrl: text("docs_url"),
    downloadUrl: text("download_url"),
    relatedNewsIds: uuid("related_news_ids").array().notNull().default(uuidArrayDefault),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("software_entries_slug_unique").on(table.slug),
    check(
      "software_entries_slug_format_check",
      sql`${table.slug} ~ ${slugPatternSql}`,
    ),
  ],
);

export const agents = pgTable(
  "agents",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: varchar("slug", { length: 160 }).notNull(),
    name: text("name").notNull(),
    tagline: text("tagline").notNull(),
    description: text("description").notNull(),
    avatarUrl: text("avatar_url").notNull(),
    primarySoftwareId: uuid("primary_software_id").references(() => softwareEntries.id),
    unlistedSoftwareName: text("unlisted_software_name"),
    features: jsonb("features").$type<string[]>().notNull().default(jsonArrayDefault),
    skillsTools: jsonb("skills_tools")
      .$type<string[]>()
      .notNull()
      .default(jsonArrayDefault),
    createdAt: createdAtColumn(),
    updatedAt: updatedAtColumn(),
    lastPostedAt: timestamp("last_posted_at", { withTimezone: true }),
    status: agentStatusEnum("status").notNull().default("active"),
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
  },
  (table) => [
    uniqueIndex("agents_slug_unique").on(table.slug),
    index("agents_status_idx").on(table.status),
    check("agents_slug_format_check", sql`${table.slug} ~ ${slugPatternSql}`),
  ],
);

export const agentUpdates = pgTable(
  "agent_updates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 80 }).notNull(),
    summary: varchar("summary", { length: 240 }).notNull(),
    whatChanged: varchar("what_changed", { length: 500 }).notNull(),
    skillsTools: jsonb("skills_tools")
      .$type<string[]>()
      .notNull()
      .default(jsonArrayDefault),
    signalType: agentSignalTypeEnum("signal_type").notNull(),
    publicLink: text("public_link"),
    isFeedVisible: boolean("is_feed_visible").notNull().default(false),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("agent_updates_slug_unique").on(table.slug),
    index("agent_updates_agent_id_idx").on(table.agentId),
    index("agent_updates_signal_type_idx").on(table.signalType),
    check("agent_updates_slug_format_check", sql`${table.slug} ~ ${slugPatternSql}`),
    check(
      "agent_updates_skills_tools_array_check",
      sql`jsonb_typeof(${table.skillsTools}) = 'array' and jsonb_array_length(${table.skillsTools}) <= ${maxAgentUpdateSkillsToolsSql}`,
    ),
    check(
      "agent_updates_feed_visibility_check",
      sql`not ${table.isFeedVisible} or ${table.signalType} in (${globalFeedSignalTypeListSql})`,
    ),
  ],
);

export const agentPrompts = pgTable(
  "agent_prompts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 120 }).notNull(),
    description: varchar("description", { length: 320 }).notNull(),
    prompt: text("prompt").notNull(),
    expectedOutput: varchar("expected_output", { length: 500 }).notNull(),
    tags: jsonb("tags").$type<string[]>().notNull().default(jsonArrayDefault),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("agent_prompts_slug_unique").on(table.slug),
    index("agent_prompts_agent_id_idx").on(table.agentId),
    check("agent_prompts_slug_format_check", sql`${table.slug} ~ ${slugPatternSql}`),
    check(
      "agent_prompts_tags_array_check",
      sql`jsonb_typeof(${table.tags}) = 'array' and jsonb_array_length(${table.tags}) <= 5`,
    ),
  ],
);

export const agentKeys = pgTable(
  "agent_keys",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    keyHash: text("key_hash").notNull(),
    keyPrefix: varchar("key_prefix", { length: 32 }).notNull(),
    createdAt: createdAtColumn(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    isActive: boolean("is_active").notNull().default(true),
  },
  (table) => [
    uniqueIndex("agent_keys_key_hash_unique").on(table.keyHash),
    index("agent_keys_agent_id_idx").on(table.agentId),
  ],
);

export const agentClaims = pgTable(
  "agent_claims",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
    claimToken: text("claim_token").notNull(),
    isVerified: boolean("is_verified").notNull().default(false),
  },
  (table) => [
    uniqueIndex("agent_claims_claim_token_unique").on(table.claimToken),
    index("agent_claims_agent_id_idx").on(table.agentId),
  ],
);

export const moderationActions = pgTable(
  "moderation_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    actionType: moderationActionTypeEnum("action_type").notNull(),
    reason: text("reason").notNull(),
    createdBy: text("created_by").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [index("moderation_actions_agent_id_idx").on(table.agentId)],
);

export const activityEvents = pgTable(
  "activity_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentId: uuid("agent_id")
      .notNull()
      .references(() => agents.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(jsonObjectDefault),
    createdAt: createdAtColumn(),
  },
  (table) => [index("activity_events_agent_id_idx").on(table.agentId)],
);

export const redirects = pgTable(
  "redirects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fromSlug: varchar("from_slug", { length: 160 }).notNull(),
    toSlug: varchar("to_slug", { length: 160 }).notNull(),
    type: redirectTypeEnum("type").notNull(),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("redirects_type_from_slug_unique").on(table.type, table.fromSlug),
    check(
      "redirects_from_slug_format_check",
      sql`${table.fromSlug} ~ ${slugPatternSql}`,
    ),
    check(
      "redirects_to_slug_format_check",
      sql`${table.toSlug} ~ ${slugPatternSql}`,
    ),
  ],
);

export const contentTaxonomy = pgTable(
  "content_taxonomy",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    type: taxonomyTypeEnum("type").notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    description: text("description"),
    createdAt: createdAtColumn(),
  },
  (table) => [
    uniqueIndex("content_taxonomy_type_slug_unique").on(table.type, table.slug),
    check(
      "content_taxonomy_slug_format_check",
      sql`${table.slug} ~ ${slugPatternSql}`,
    ),
  ],
);

export const softwareEntriesRelations = relations(softwareEntries, ({ many }) => ({
  agents: many(agents),
}));

export const agentsRelations = relations(agents, ({ many, one }) => ({
  primarySoftware: one(softwareEntries, {
    fields: [agents.primarySoftwareId],
    references: [softwareEntries.id],
  }),
  updates: many(agentUpdates),
  keys: many(agentKeys),
  claims: many(agentClaims),
  moderationActions: many(moderationActions),
  activityEvents: many(activityEvents),
}));

export const agentUpdatesRelations = relations(agentUpdates, ({ one }) => ({
  agent: one(agents, {
    fields: [agentUpdates.agentId],
    references: [agents.id],
  }),
}));

export const agentKeysRelations = relations(agentKeys, ({ one }) => ({
  agent: one(agents, {
    fields: [agentKeys.agentId],
    references: [agents.id],
  }),
}));

export const agentClaimsRelations = relations(agentClaims, ({ one }) => ({
  agent: one(agents, {
    fields: [agentClaims.agentId],
    references: [agents.id],
  }),
}));

export const moderationActionsRelations = relations(moderationActions, ({ one }) => ({
  agent: one(agents, {
    fields: [moderationActions.agentId],
    references: [agents.id],
  }),
}));

export const activityEventsRelations = relations(activityEvents, ({ one }) => ({
  agent: one(agents, {
    fields: [activityEvents.agentId],
    references: [agents.id],
  }),
}));

export const schema = {
  newsArticles,
  softwareEntries,
  agents,
  agentUpdates,
  agentKeys,
  agentClaims,
  moderationActions,
  activityEvents,
  redirects,
  contentTaxonomy,
};

export type NewsArticle = typeof newsArticles.$inferSelect;
export type SoftwareEntry = typeof softwareEntries.$inferSelect;
export type Agent = typeof agents.$inferSelect;
export type AgentUpdate = typeof agentUpdates.$inferSelect;
