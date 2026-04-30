CREATE TABLE "agent_prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(120) NOT NULL,
	"description" varchar(320) NOT NULL,
	"prompt" text NOT NULL,
	"expected_output" varchar(500) NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "agent_prompts_slug_format_check" CHECK ("agent_prompts"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "agent_prompts_tags_array_check" CHECK (jsonb_typeof("agent_prompts"."tags") = 'array' and jsonb_array_length("agent_prompts"."tags") <= 5)
);
--> statement-breakpoint
ALTER TABLE "agent_prompts" ADD CONSTRAINT "agent_prompts_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "agent_prompts_slug_unique" ON "agent_prompts" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "agent_prompts_agent_id_idx" ON "agent_prompts" USING btree ("agent_id");