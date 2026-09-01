CREATE TABLE "comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"image_label" text,
	"has_image" boolean DEFAULT false NOT NULL,
	"product_id" integer,
	"repost_of_id" integer,
	"posted_at" timestamp DEFAULT now() NOT NULL,
	"comment_count" integer DEFAULT 0 NOT NULL,
	"repost_count" integer DEFAULT 0 NOT NULL,
	"like_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "people" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"handle" varchar(60) NOT NULL,
	CONSTRAINT "people_handle_unique" UNIQUE("handle")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" text NOT NULL,
	"excerpt" text NOT NULL,
	"body" text,
	"category" varchar(80) NOT NULL,
	"topic_label" varchar(80),
	"image_label" text NOT NULL,
	"image_url" text,
	"author" varchar(120) DEFAULT 'the Lilac Drawer editors' NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL,
	"is_new_home" boolean DEFAULT false NOT NULL,
	"is_home_preview" boolean DEFAULT false NOT NULL,
	"is_home_review" boolean DEFAULT false NOT NULL,
	"is_recent_blog" boolean DEFAULT false NOT NULL,
	"is_side_story" boolean DEFAULT false NOT NULL,
	"is_deals_preview" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"name" text NOT NULL,
	"subtitle" text,
	"category" varchar(80) NOT NULL,
	"image_label" text NOT NULL,
	"image_url" text,
	"price_cents" integer NOT NULL,
	"compare_at_price_cents" integer,
	"affiliate_url" text,
	"rank" integer,
	"rank_note" text,
	"badge" varchar(40),
	"discount_percent" integer,
	"is_featured_home" boolean DEFAULT false NOT NULL,
	"is_top_pick" boolean DEFAULT false NOT NULL,
	"is_featured_deals" boolean DEFAULT false NOT NULL,
	"is_sale_off" boolean DEFAULT false NOT NULL,
	"is_today_deal" boolean DEFAULT false NOT NULL,
	"is_new_arrival" boolean DEFAULT false NOT NULL,
	"is_best_seller" boolean DEFAULT false NOT NULL,
	"is_explore_deal" boolean DEFAULT false NOT NULL,
	"is_recommended" boolean DEFAULT false NOT NULL,
	"is_saved" boolean DEFAULT false NOT NULL,
	"is_suggested" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "products_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "site_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"icon" varchar(16),
	"color_hex" varchar(16),
	"href" text,
	"section" varchar(40) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trends" (
	"id" serial PRIMARY KEY NOT NULL,
	"category" varchar(40) NOT NULL,
	"tag" text NOT NULL,
	"post_count" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
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
	"handle" text NOT NULL,
	"bio" text,
	CONSTRAINT "user_email_unique" UNIQUE("email"),
	CONSTRAINT "user_handle_unique" UNIQUE("handle")
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
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_posts" ADD CONSTRAINT "community_posts_repost_of_id_community_posts_id_fk" FOREIGN KEY ("repost_of_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_post_id_community_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."community_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "likes" ADD CONSTRAINT "likes_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "likes_post_user_unique" ON "likes" USING btree ("post_id","user_id");--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");