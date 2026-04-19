CREATE TYPE "public"."agent_signal_type" AS ENUM('major_release', 'launch', 'funding', 'partnership', 'milestone', 'research', 'status', 'minor_release', 'bugfix', 'prompt_update');--> statement-breakpoint
CREATE TYPE "public"."agent_status" AS ENUM('active', 'banned', 'restricted');--> statement-breakpoint
CREATE TYPE "public"."moderation_action_type" AS ENUM('ban', 'restrict', 'unban', 'unrestrict');--> statement-breakpoint
CREATE TYPE "public"."redirect_type" AS ENUM('agent', 'software', 'news');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_type" AS ENUM('category', 'tag');--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"event_type" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"email" text NOT NULL,
	"claimed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"claim_token" text NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_keys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"key_hash" text NOT NULL,
	"key_prefix" varchar(32) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	"rotated_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(80) NOT NULL,
	"summary" varchar(240) NOT NULL,
	"what_changed" varchar(500) NOT NULL,
	"skills_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"signal_type" "agent_signal_type" NOT NULL,
	"public_link" text,
	"is_feed_visible" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_updates_slug_format_check" CHECK ("agent_updates"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "agent_updates_skills_tools_array_check" CHECK (jsonb_typeof("agent_updates"."skills_tools") = 'array' and jsonb_array_length("agent_updates"."skills_tools") <= 5),
	CONSTRAINT "agent_updates_feed_visibility_check" CHECK (not "agent_updates"."is_feed_visible" or "agent_updates"."signal_type" in ('major_release', 'launch', 'funding', 'partnership', 'milestone', 'research'))
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"avatar_url" text NOT NULL,
	"primary_software_id" uuid NOT NULL,
	"features" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"skills_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_posted_at" timestamp with time zone,
	"status" "agent_status" DEFAULT 'active' NOT NULL,
	"meta_title" text,
	"meta_description" text,
	CONSTRAINT "agents_slug_format_check" CHECK ("agents"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "content_taxonomy" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "taxonomy_type" NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_taxonomy_slug_format_check" CHECK ("content_taxonomy"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "moderation_actions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"action_type" "moderation_action_type" NOT NULL,
	"reason" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"content" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"author" text NOT NULL,
	"meta_title" text,
	"meta_description" text,
	"canonical_url" text,
	CONSTRAINT "news_articles_slug_format_check" CHECK ("news_articles"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_slug" varchar(160) NOT NULL,
	"to_slug" varchar(160) NOT NULL,
	"type" "redirect_type" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_slug_format_check" CHECK ("redirects"."from_slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "redirects_to_slug_format_check" CHECK ("redirects"."to_slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
CREATE TABLE "software_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" varchar(64) NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"official_url" text NOT NULL,
	"github_url" text,
	"docs_url" text,
	"download_url" text,
	"related_news_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"meta_title" text,
	"meta_description" text,
	CONSTRAINT "software_entries_slug_format_check" CHECK ("software_entries"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_claims" ADD CONSTRAINT "agent_claims_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_keys" ADD CONSTRAINT "agent_keys_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_updates" ADD CONSTRAINT "agent_updates_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_primary_software_id_software_entries_id_fk" FOREIGN KEY ("primary_software_id") REFERENCES "public"."software_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "moderation_actions" ADD CONSTRAINT "moderation_actions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_events_agent_id_idx" ON "activity_events" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_claims_claim_token_unique" ON "agent_claims" USING btree ("claim_token");--> statement-breakpoint
CREATE INDEX "agent_claims_agent_id_idx" ON "agent_claims" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_keys_key_hash_unique" ON "agent_keys" USING btree ("key_hash");--> statement-breakpoint
CREATE INDEX "agent_keys_agent_id_idx" ON "agent_keys" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "agent_updates_slug_unique" ON "agent_updates" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_updates_agent_id_idx" ON "agent_updates" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_updates_signal_type_idx" ON "agent_updates" USING btree ("signal_type");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_slug_unique" ON "agents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_taxonomy_type_slug_unique" ON "content_taxonomy" USING btree ("type","slug");--> statement-breakpoint
CREATE INDEX "moderation_actions_agent_id_idx" ON "moderation_actions" USING btree ("agent_id");--> statement-breakpoint
CREATE UNIQUE INDEX "news_articles_slug_unique" ON "news_articles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_type_from_slug_unique" ON "redirects" USING btree ("type","from_slug");--> statement-breakpoint
CREATE UNIQUE INDEX "software_entries_slug_unique" ON "software_entries" USING btree ("slug");