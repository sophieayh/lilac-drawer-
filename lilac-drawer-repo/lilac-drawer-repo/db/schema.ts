import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  varchar,
  jsonb,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export interface ArticleStorePrice {
  id: string;
  storeName: string;
  price: string;
  url: string;
}

export interface ArticleFeaturedProduct {
  id: string;
  name: string;
  subtitle?: string;
  imageUrl?: string;
  imageLabel?: string;
  stores: ArticleStorePrice[];
  summary: string;
}

export interface ArticleKeywordLink {
  keyword: string;
  url: string;
}

export interface ArticleCustomSection {
  id: string;
  title: string;
  imageUrl?: string;
  imageLabel?: string;
  content: string;
}

export interface ArticleStructuredContent {
  keywordLinks?: ArticleKeywordLink[];
  recommendedProducts?: ArticleFeaturedProduct[];
  customSections?: ArticleCustomSection[];
}

// NOTE — kept in sync by hand with lilac-drawer-admin/db/schema.ts.
// Both apps are separate Next.js projects pointed at the *same* Postgres
// database, so this file and the admin app's copy must always describe the
// exact same tables/columns. This project owns migrations (`npm run
// db:generate` / `db:migrate`) — after changing a table here, copy the same
// change into the admin app's schema.ts before deploying either app.

/**
 * Unified product/deal catalog. Every "list of products" section across the
 * site (home picks, deals page grids, explore cards, saved picks, etc.) is a
 * filtered/sorted query against this one table instead of a separate array
 * per section.
 */
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  name: text("name").notNull(),
  subtitle: text("subtitle"), // e.g. "Editor's Choice", "Set of 6"
  category: varchar("category", { length: 80 }).notNull(),
  imageLabel: text("image_label").notNull(), // alt text / placeholder label until real photos exist
  imageUrl: text("image_url"), // real product photo, once available
  priceCents: integer("price_cents").notNull(),
  compareAtPriceCents: integer("compare_at_price_cents"), // the "was" price, nullable
  affiliateUrl: text("affiliate_url"),
  stores: jsonb("stores").$type<ArticleStorePrice[]>(),

  rank: integer("rank"), // for the Top 10 list
  rankNote: text("rank_note"),
  badge: varchar("badge", { length: 40 }), // "NEW", "HOT", etc.
  discountPercent: integer("discount_percent"),
  inStock: boolean("in_stock").notNull().default(true),

  // Placement flags: which section(s) of the site this product appears in.
  isFeaturedHome: boolean("is_featured_home").notNull().default(false),
  isTopPick: boolean("is_top_pick").notNull().default(false),
  isFeaturedDeals: boolean("is_featured_deals").notNull().default(false),
  isSaleOff: boolean("is_sale_off").notNull().default(false),
  isTodayDeal: boolean("is_today_deal").notNull().default(false),
  isNewArrival: boolean("is_new_arrival").notNull().default(false),
  isBestSeller: boolean("is_best_seller").notNull().default(false),
  isExploreDeal: boolean("is_explore_deal").notNull().default(false),
  isRecommended: boolean("is_recommended").notNull().default(false),
  isSaved: boolean("is_saved").notNull().default(false),
  isSuggested: boolean("is_suggested").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * Blog/editorial content — reviews, care guides, buying guides, and posts.
 * `category` is the topical label shown on the card ("REVIEWS", "CARE",
 * "GUIDES", or a product category like "Wardrobe" for the home reviews
 * strip). Placement flags control which page sections pull it in.
 */
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: text("title").notNull(),
  excerpt: text("excerpt").notNull(),
  body: text("body"), // full article body, rendered on /blog/[slug]
  structuredContent: jsonb("structured_content").$type<ArticleStructuredContent>(),
  category: varchar("category", { length: 80 }).notNull(),
  topicLabel: varchar("topic_label", { length: 80 }), // display label for the home "Latest Reviews" strip (e.g. "Wardrobe") — distinct from the canonical `category` used for blog filtering, so the same article doesn't need a duplicate row per display context
  imageLabel: text("image_label").notNull(),
  imageUrl: text("image_url"),
  author: varchar("author", { length: 120 }).notNull().default("the Lilac Drawer editors"),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),

  // Draft/publish workflow for the admin dashboard's Articles page — a
  // draft (isPublished = false) is fully invisible on the public site
  // (excluded from every listing query, the article page itself, and the
  // sitemap) until the admin publishes it. Existing rows default to
  // published so nothing already live gets hidden by this migration.
  isPublished: boolean("is_published").notNull().default(true),
  // Manual display order for post listings (lower = shown first), set from
  // the admin dashboard's Articles page. Ties broken by publishedAt desc.
  sortOrder: integer("sort_order").notNull().default(0),

  isHomeSpread: boolean("is_home_spread").notNull().default(false), // home editorial spread (top 2 articles)
  isNewHome: boolean("is_new_home").notNull().default(false), // home "New + Updated"
  isHomePreview: boolean("is_home_preview").notNull().default(false), // home "From the Blog"
  isHomeReview: boolean("is_home_review").notNull().default(false), // home "Latest Reviews"
  isHomeGuide: boolean("is_home_guide").notNull().default(false), // home featured buying guide banner
  isRecentBlog: boolean("is_recent_blog").notNull().default(false), // blog page "Latest Posts"
  isSideStory: boolean("is_side_story").notNull().default(false), // blog page side column
  isDealsPreview: boolean("is_deals_preview").notNull().default(false), // deals page "Latest Blog"

  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export interface SubCategoryItem {
  id: string;
  label: string;
  href?: string;
  description?: string;
}

/** Nav/sidebar category chips (Clothing Care, Accessories, Explore's emoji tiles...). */
export const siteCategories = pgTable("site_categories", {
  id: serial("id").primaryKey(),
  label: text("label").notNull(),
  slug: varchar("slug", { length: 160 }),
  icon: varchar("icon", { length: 16 }),
  colorHex: varchar("color_hex", { length: 16 }),
  href: text("href"),
  section: varchar("section", { length: 40 }).notNull().default("header"), // "header" | "sidebar" | "explore"
  subcategories: jsonb("subcategories").$type<SubCategoryItem[]>(),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Community/social feed posts (used identically on /community and, on each
 * user's own profile). A "repost with opinion" is just another row here —
 * `repostOfId` points at the original post and `body` holds the reposter's
 * own commentary (empty string for a plain repost). A "share a product"
 * post sets `productId`. */
export const communityPosts = pgTable("community_posts", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull().default(""),
  imageLabel: text("image_label"),
  hasImage: boolean("has_image").notNull().default(false),
  imageUrl: text("image_url"),
  productId: integer("product_id").references((): AnyPgColumn => products.id, { onDelete: "set null" }),
  repostOfId: integer("repost_of_id").references((): AnyPgColumn => communityPosts.id, { onDelete: "cascade" }),
  postedAt: timestamp("posted_at").notNull().defaultNow(),
  // Denormalized counters, incremented/decremented by the mutation actions
  // that create/remove a comment, repost, or like — avoids a COUNT() query
  // on every feed render.
  commentCount: integer("comment_count").notNull().default(0),
  repostCount: integer("repost_count").notNull().default(0),
  likeCount: integer("like_count").notNull().default(0),
});

/** A comment on a community post. */
export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** A like on a community post — one row per (post, user). */
export const likes = pgTable(
  "likes",
  {
    id: serial("id").primaryKey(),
    postId: integer("post_id").notNull().references(() => communityPosts.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [uniqueIndex("likes_post_user_unique").on(table.postId, table.userId)],
);

/** Trending tags shown in the Community sidebar. */
export const trends = pgTable("trends", {
  id: serial("id").primaryKey(),
  category: varchar("category", { length: 40 }).notNull(),
  tag: text("tag").notNull(),
  postCount: integer("post_count").notNull().default(0),
});

/**
 * One row per public-page view, logged by the client-side VisitTracker via
 * POST /api/track-visit. Deliberately minimal (no IP/user-agent storage) —
 * this only powers the admin dashboard's traffic count/trend, not per-user
 * analytics. /admin/* itself is never tracked here.
 */
export const pageViews = pgTable("page_views", {
  id: serial("id").primaryKey(),
  path: text("path").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
