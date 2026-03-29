CREATE TYPE "public"."api_key_scope" AS ENUM('content:write', 'agents:write', 'skills:write', 'prompts:write', 'taxonomy:write', 'admin:*');--> statement-breakpoint
CREATE TYPE "public"."ingestion_status" AS ENUM('accepted', 'applied', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."ingestion_target" AS ENUM('content', 'agent', 'prompt', 'skill', 'taxonomy');--> statement-breakpoint
CREATE TABLE "api_keys" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"label" text NOT NULL,
	"key_prefix" text NOT NULL,
	"key_hash" text NOT NULL,
	"scopes" "api_key_scope"[] NOT NULL,
	"description" text,
	"expires_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"last_used_ip" text,
	"created_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ingestion_events" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"api_key_id" uuid NOT NULL,
	"target" "ingestion_target" NOT NULL,
	"action" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"external_id" text,
	"payload" jsonb NOT NULL,
	"payload_hash" text NOT NULL,
	"status" "ingestion_status" DEFAULT 'accepted' NOT NULL,
	"error_message" text,
	"processed_at" timestamp with time zone,
	"created_record_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ingestion_events" ADD CONSTRAINT "ingestion_events_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "api_keys_key_prefix_idx" ON "api_keys" USING btree ("key_prefix");--> statement-breakpoint
CREATE INDEX "api_keys_revoked_at_idx" ON "api_keys" USING btree ("revoked_at");--> statement-breakpoint
CREATE INDEX "api_keys_expires_at_idx" ON "api_keys" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ingestion_events_api_key_idempotency_idx" ON "ingestion_events" USING btree ("api_key_id","idempotency_key");--> statement-breakpoint
CREATE INDEX "ingestion_events_target_status_idx" ON "ingestion_events" USING btree ("target","status");
