ALTER TABLE "products" ADD COLUMN "brand_id" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "scale" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "size_cm" real;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "material" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "color" text DEFAULT '' NOT NULL;