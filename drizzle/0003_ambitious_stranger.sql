ALTER TABLE "api_keys" ADD COLUMN "encrypted_secret" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "secret_nonce" text;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "secret_algorithm" text DEFAULT 'aes-256-gcm' NOT NULL;