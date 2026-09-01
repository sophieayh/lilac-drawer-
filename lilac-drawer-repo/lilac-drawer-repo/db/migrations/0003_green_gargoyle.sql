CREATE TABLE "page_views" (
	"id" serial PRIMARY KEY NOT NULL,
	"path" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "is_published" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text DEFAULT 'user' NOT NULL;