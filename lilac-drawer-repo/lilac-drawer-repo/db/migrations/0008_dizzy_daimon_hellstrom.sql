ALTER TABLE "site_categories" ALTER COLUMN "section" SET DEFAULT 'header';--> statement-breakpoint
ALTER TABLE "site_categories" ADD COLUMN "slug" varchar(160);--> statement-breakpoint
ALTER TABLE "site_categories" ADD COLUMN "subcategories" jsonb;--> statement-breakpoint
ALTER TABLE "site_categories" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "site_categories" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;