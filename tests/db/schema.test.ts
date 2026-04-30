import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { getTableName } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import {
  CONTENT_BOUNDARIES,
  GLOBAL_FEED_SIGNAL_TYPES,
  PROFILE_ONLY_SIGNAL_TYPES,
  PUBLIC_ROUTE_CONTRACTS,
  agents,
  agentUpdates,
  newsArticles,
  redirects,
  softwareEntries,
} from "../../db/schema";

function readMigrationSql(prefix: string) {
  const migrationsDirectory = join(process.cwd(), "db", "migrations");
  const migrationFile = readdirSync(migrationsDirectory).find(
    (entry) => entry.startsWith(prefix) && entry.endsWith(".sql"),
  );

  if (!migrationFile) {
    throw new Error(`Expected a generated Drizzle SQL migration file for ${prefix}.`);
  }

  return readFileSync(join(migrationsDirectory, migrationFile), "utf8");
}

const baselineMigrationSql = readMigrationSql("0000_");
const nullableAgentSoftwareMigrationSql = readMigrationSql("0001_");

describe("Task 3 schema contracts", () => {
  it("keeps software and agent identifiers independent across content types", () => {
    expect(CONTENT_BOUNDARIES).toEqual({
      selfService: ["agents", "agent_updates"],
      adminManaged: ["news_articles", "software_entries"],
      repoContent: ["docs"],
    });
    expect(PUBLIC_ROUTE_CONTRACTS).toEqual({
      newsArticle: "/news/[slug]",
      softwareEntry: "/software/[slug]",
      agentProfile: "/agents/[slug]",
      agentUpdate: "/agents/[agentSlug]/updates/[updateSlug]",
    });

    expect(getTableName(softwareEntries)).toBe("software_entries");
    expect(getTableName(agents)).toBe("agents");
    expect(getTableName(agentUpdates)).toBe("agent_updates");

    expect(baselineMigrationSql).toContain('CREATE TABLE "software_entries"');
    expect(baselineMigrationSql).toContain('CREATE TABLE "agents"');
    expect(baselineMigrationSql).toContain(
      'FOREIGN KEY ("primary_software_id") REFERENCES "public"."software_entries"("id")',
    );
    expect(baselineMigrationSql).not.toContain('CREATE TABLE "docs"');
    expect(nullableAgentSoftwareMigrationSql).toContain(
      'ALTER TABLE "agents" ALTER COLUMN "primary_software_id" DROP NOT NULL',
    );
  });

  it("supports both global-feed-visible and profile-only signal classes", () => {
    expect(GLOBAL_FEED_SIGNAL_TYPES).toEqual([
      "major_release",
      "launch",
      "funding",
      "partnership",
      "milestone",
      "research",
    ]);
    expect(PROFILE_ONLY_SIGNAL_TYPES).toEqual([
      "status",
      "minor_release",
      "bugfix",
      "prompt_update",
    ]);

    expect(baselineMigrationSql).toContain(
      'CREATE TYPE "public"."agent_signal_type" AS ENUM(\'major_release\', \'launch\', \'funding\', \'partnership\', \'milestone\', \'research\', \'status\', \'minor_release\', \'bugfix\', \'prompt_update\')',
    );
    expect(baselineMigrationSql).toContain(
      'CONSTRAINT "agent_updates_feed_visibility_check" CHECK (not "agent_updates"."is_feed_visible" or "agent_updates"."signal_type" in (\'major_release\', \'launch\', \'funding\', \'partnership\', \'milestone\', \'research\'))',
    );
  });

  it("enforces slug uniqueness per content type", () => {
    expect(getTableName(newsArticles)).toBe("news_articles");
    expect(getTableName(redirects)).toBe("redirects");

    expect(baselineMigrationSql).toContain(
      'CREATE UNIQUE INDEX "news_articles_slug_unique" ON "news_articles" USING btree ("slug")',
    );
    expect(baselineMigrationSql).toContain(
      'CREATE UNIQUE INDEX "software_entries_slug_unique" ON "software_entries" USING btree ("slug")',
    );
    expect(baselineMigrationSql).toContain(
      'CREATE UNIQUE INDEX "agents_slug_unique" ON "agents" USING btree ("slug")',
    );
    expect(baselineMigrationSql).toContain(
      'CREATE UNIQUE INDEX "agent_updates_slug_unique" ON "agent_updates" USING btree ("slug")',
    );
    expect(baselineMigrationSql).toContain(
      'CREATE UNIQUE INDEX "redirects_type_from_slug_unique" ON "redirects" USING btree ("type","from_slug")',
    );
    expect(baselineMigrationSql).toContain(
      'CONSTRAINT "news_articles_slug_format_check" CHECK ("news_articles"."slug" ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\')',
    );
    expect(baselineMigrationSql).toContain(
      'CONSTRAINT "software_entries_slug_format_check" CHECK ("software_entries"."slug" ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\')',
    );
    expect(baselineMigrationSql).toContain(
      'CONSTRAINT "agents_slug_format_check" CHECK ("agents"."slug" ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\')',
    );
    expect(baselineMigrationSql).toContain(
      'CONSTRAINT "agent_updates_slug_format_check" CHECK ("agent_updates"."slug" ~ \'^[a-z0-9]+(?:-[a-z0-9]+)*$\')',
    );
  });
});
