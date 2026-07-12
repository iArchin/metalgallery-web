ALTER TABLE "otps" ADD COLUMN "prev_code_hash" text;--> statement-breakpoint
ALTER TABLE "otps" ADD COLUMN "prev_expires_at" timestamp with time zone;