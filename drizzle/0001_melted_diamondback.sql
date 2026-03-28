CREATE TABLE "content_revisions" (
	"id" uuid PRIMARY KEY DEFAULT pg_catalog.gen_random_uuid() NOT NULL,
	"content_item_id" uuid NOT NULL,
	"revision_number" integer NOT NULL,
	"kind" "content_kind" NOT NULL,
	"subtype" "content_subtype",
	"status" "publication_status" NOT NULL,
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
	"edited_by_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_content_item_id_content_items_id_fk" FOREIGN KEY ("content_item_id") REFERENCES "public"."content_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_edited_by_id_user_id_fk" FOREIGN KEY ("edited_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "content_revisions_item_revision_idx" ON "content_revisions" USING btree ("content_item_id","revision_number");--> statement-breakpoint
CREATE INDEX "content_revisions_item_created_idx" ON "content_revisions" USING btree ("content_item_id","created_at");