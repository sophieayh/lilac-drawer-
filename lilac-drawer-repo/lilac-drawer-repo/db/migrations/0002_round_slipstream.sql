ALTER TABLE "posts" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "in_stock" boolean DEFAULT true NOT NULL;