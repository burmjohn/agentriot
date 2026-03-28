CREATE TYPE "public"."content_kind" AS ENUM('article', 'tutorial');--> statement-breakpoint
CREATE TYPE "public"."content_subtype" AS ENUM('news', 'blog', 'analysis', 'roundup', 'guide', 'release-note');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'review', 'scheduled', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_kind" AS ENUM('category', 'tag', 'type');--> statement-breakpoint
CREATE TYPE "public"."taxonomy_scope" AS ENUM('content', 'agent', 'prompt', 'skill');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_prompts" (
	"agent_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	CONSTRAINT "agent_prompts_agent_id_prompt_id_pk" PRIMARY KEY("agent_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "agent_skills" (
	"agent_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "agent_skills_agent_id_skill_id_pk" PRIMARY KEY("agent_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "agent_taxonomy_terms" (
	"agent_id" uuid NOT NULL,
	"taxonomy_term_id" uuid NOT NULL,
	CONSTRAINT "agent_taxonomy_terms_agent_id_taxonomy_term_id_pk" PRIMARY KEY("agent_id","taxonomy_term_id")
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text,
	"long_description" text,
	"website_url" text,
	"github_url" text,
	"pricing_notes" text,
	"last_verified_at" timestamp with time zone,
	"is_featured" boolean DEFAULT false NOT NULL,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_agents" (
	"content_item_id" uuid NOT NULL,
	"agent_id" uuid NOT NULL,
	CONSTRAINT "content_agents_content_item_id_agent_id_pk" PRIMARY KEY("content_item_id","agent_id")
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"kind" "content_kind" NOT NULL,
	"subtype" "content_subtype",
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"excerpt" text,
	"body" text,
	"hero_image_url" text,
	"canonical_url" text,
	"seo_title" text,
	"seo_description" text,
	"published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_prompts" (
	"content_item_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	CONSTRAINT "content_prompts_content_item_id_prompt_id_pk" PRIMARY KEY("content_item_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "content_skills" (
	"content_item_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	CONSTRAINT "content_skills_content_item_id_skill_id_pk" PRIMARY KEY("content_item_id","skill_id")
);
--> statement-breakpoint
CREATE TABLE "content_taxonomy_terms" (
	"content_item_id" uuid NOT NULL,
	"taxonomy_term_id" uuid NOT NULL,
	CONSTRAINT "content_taxonomy_terms_content_item_id_taxonomy_term_id_pk" PRIMARY KEY("content_item_id","taxonomy_term_id")
);
--> statement-breakpoint
CREATE TABLE "prompt_taxonomy_terms" (
	"prompt_id" uuid NOT NULL,
	"taxonomy_term_id" uuid NOT NULL,
	CONSTRAINT "prompt_taxonomy_terms_prompt_id_taxonomy_term_id_pk" PRIMARY KEY("prompt_id","taxonomy_term_id")
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text,
	"full_description" text,
	"prompt_body" text NOT NULL,
	"provider_compatibility" text,
	"variables_schema" text,
	"example_output" text,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"source_path" text NOT NULL,
	"target_path" text NOT NULL,
	"is_permanent" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_prompts" (
	"skill_id" uuid NOT NULL,
	"prompt_id" uuid NOT NULL,
	CONSTRAINT "skill_prompts_skill_id_prompt_id_pk" PRIMARY KEY("skill_id","prompt_id")
);
--> statement-breakpoint
CREATE TABLE "skill_taxonomy_terms" (
	"skill_id" uuid NOT NULL,
	"taxonomy_term_id" uuid NOT NULL,
	CONSTRAINT "skill_taxonomy_terms_skill_id_taxonomy_term_id_pk" PRIMARY KEY("skill_id","taxonomy_term_id")
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"short_description" text,
	"long_description" text,
	"website_url" text,
	"github_url" text,
	"created_by_id" text,
	"updated_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "taxonomy_terms" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"scope" "taxonomy_scope" NOT NULL,
	"kind" "taxonomy_kind" NOT NULL,
	"label" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_prompts" ADD CONSTRAINT "agent_prompts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_prompts" ADD CONSTRAINT "agent_prompts_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_skills" ADD CONSTRAINT "agent_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_taxonomy_terms" ADD CONSTRAINT "agent_taxonomy_terms_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_taxonomy_terms" ADD CONSTRAINT "agent_taxonomy_terms_taxonomy_term_id_taxonomy_terms_id_fk" FOREIGN KEY ("taxonomy_term_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_agents" ADD CONSTRAINT "content_agents_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_agents" ADD CONSTRAINT "content_agents_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_prompts" ADD CONSTRAINT "content_prompts_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_prompts" ADD CONSTRAINT "content_prompts_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_skills" ADD CONSTRAINT "content_skills_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_skills" ADD CONSTRAINT "content_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_taxonomy_terms" ADD CONSTRAINT "content_taxonomy_terms_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_taxonomy_terms" ADD CONSTRAINT "content_taxonomy_terms_taxonomy_term_id_taxonomy_terms_id_fk" FOREIGN KEY ("taxonomy_term_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_taxonomy_terms" ADD CONSTRAINT "prompt_taxonomy_terms_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompt_taxonomy_terms" ADD CONSTRAINT "prompt_taxonomy_terms_taxonomy_term_id_taxonomy_terms_id_fk" FOREIGN KEY ("taxonomy_term_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prompts" ADD CONSTRAINT "skill_prompts_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_prompts" ADD CONSTRAINT "skill_prompts_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_taxonomy_terms" ADD CONSTRAINT "skill_taxonomy_terms_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_taxonomy_terms" ADD CONSTRAINT "skill_taxonomy_terms_taxonomy_term_id_taxonomy_terms_id_fk" FOREIGN KEY ("taxonomy_term_id") REFERENCES "public"."taxonomy_terms"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skills" ADD CONSTRAINT "skills_updated_by_id_user_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE UNIQUE INDEX "agents_slug_idx" ON "agents" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agents_status_idx" ON "agents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agents_last_verified_idx" ON "agents" USING btree ("last_verified_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_kind_slug_idx" ON "content_items" USING btree ("kind","slug");--> statement-breakpoint
CREATE INDEX "content_items_status_idx" ON "content_items" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_items_published_at_idx" ON "content_items" USING btree ("published_at");--> statement-breakpoint
CREATE UNIQUE INDEX "prompts_slug_idx" ON "prompts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "prompts_status_idx" ON "prompts" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "redirects_source_path_idx" ON "redirects" USING btree ("source_path");--> statement-breakpoint
CREATE UNIQUE INDEX "skills_slug_idx" ON "skills" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "skills_status_idx" ON "skills" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "taxonomy_terms_scope_kind_slug_idx" ON "taxonomy_terms" USING btree ("scope","kind","slug");