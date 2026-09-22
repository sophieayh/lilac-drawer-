import "server-only";
import { desc, eq, asc, and, or, isNull, isNotNull, gt, ne, sql, inArray, ilike } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "./index";
import { products, posts, siteCategories, communityPosts, trends, user, comments, commentReactions, likes, follows, banners, notifications } from "./schema";
import { slugify } from "@/lib/slugify";

// ---------- formatting helpers ----------
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export function formatPriceFixed(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculateDiscountPercent(priceCents: number, compareAtPriceCents: number | null | undefined): number | null {
  if (!compareAtPriceCents || compareAtPriceCents <= priceCents) return null;
  return Math.round(((compareAtPriceCents - priceCents) / compareAtPriceCents) * 100);
}

export function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const hours = Math.floor(diffMs / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function daysAgoLabel(date: Date): string {
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- products ----------
// Deals sections require products to have a genuine active discount (compareAtPriceCents > priceCents)
const hasDiscount = and(
  isNotNull(products.compareAtPriceCents),
  gt(products.compareAtPriceCents, products.priceCents)
);

export async function getHomeFeaturedDeals() {
  return db.select().from(products).where(eq(products.isFeaturedHome, true)).limit(3);
}

export async function getTopPicks() {
  return db.select().from(products).where(eq(products.isTopPick, true)).orderBy(asc(products.rank)).limit(4);
}

export async function getFeatureProducts() {
  return db.select().from(products).where(and(eq(products.isFeaturedDeals, true), hasDiscount)).limit(6);
}

export async function getSaleOffProducts() {
  return db.select().from(products).where(and(eq(products.isSaleOff, true), hasDiscount)).limit(3);
}

export async function getTodayDeals() {
  return db.select().from(products).where(and(eq(products.isTodayDeal, true), hasDiscount)).limit(4);
}

export async function getAllTodayDeals(limit?: number) {
  const query = db
    .select()
    .from(products)
    .where(and(eq(products.isTodayDeal, true), hasDiscount))
    .orderBy(desc(products.discountPercent), asc(products.priceCents));
  return limit ? query.limit(limit) : query;
}

export async function getNewArrivals() {
  return db.select().from(products).where(and(eq(products.isNewArrival, true), hasDiscount)).limit(3);
}

export async function getAllNewArrivals(limit?: number) {
  const query = db
    .select()
    .from(products)
    .where(eq(products.isNewArrival, true))
    .orderBy(desc(products.createdAt), desc(products.id));
  return limit ? query.limit(limit) : query;
}

export async function getBestSellers() {
  return db.select().from(products).where(and(eq(products.isBestSeller, true), hasDiscount)).limit(3);
}

export async function getAllBestSellers(limit?: number) {
  const query = db
    .select()
    .from(products)
    .where(eq(products.isBestSeller, true))
    .orderBy(asc(products.rank), desc(products.discountPercent));
  return limit ? query.limit(limit) : query;
}

export async function getAllDealsProducts(limit?: number) {
  const query = db
    .select()
    .from(products)
    .where(hasDiscount)
    .orderBy(desc(products.discountPercent), asc(products.priceCents));
  return limit ? query.limit(limit) : query;
}


export async function getAllProducts() {
  return db.select().from(products).orderBy(asc(products.id));
}

export async function getExploreDeals(limit = 8) {
  const explicit = await db.select().from(products).where(eq(products.isExploreDeal, true)).limit(limit);
  if (explicit.length >= limit) return explicit;
  const discounted = await db
    .select()
    .from(products)
    .where(hasDiscount)
    .orderBy(desc(products.discountPercent), asc(products.priceCents))
    .limit(limit);
  if (discounted.length > 0) return discounted;
  return db.select().from(products).orderBy(asc(products.id)).limit(limit);
}

export async function getExploreRecommended(limit = 8) {
  const explicit = await db.select().from(products).where(eq(products.isRecommended, true)).limit(limit);
  if (explicit.length > 0) return explicit;
  return db.select().from(products).orderBy(asc(products.id)).limit(limit);
}

export async function getSavedPicks(limit = 4) {
  const explicit = await db.select().from(products).where(eq(products.isSaved, true)).limit(limit);
  if (explicit.length >= limit) return explicit;
  const fallback = await db.select().from(products).orderBy(asc(products.rank)).limit(limit);
  const combined = [...explicit];
  const seen = new Set(explicit.map((p) => p.id));
  for (const p of fallback) {
    if (!seen.has(p.id) && combined.length < limit) {
      combined.push(p);
      seen.add(p.id);
    }
  }
  return combined;
}

export async function getSuggestedProducts(limit = 4) {
  const explicit = await db.select().from(products).where(eq(products.isSuggested, true)).limit(limit);
  if (explicit.length >= limit) return explicit;
  const fallback = await db.select().from(products).where(eq(products.isTopPick, true)).limit(limit);
  const combined = [...explicit];
  const seen = new Set(explicit.map((p) => p.id));
  for (const p of fallback) {
    if (!seen.has(p.id) && combined.length < limit) {
      combined.push(p);
      seen.add(p.id);
    }
  }
  return combined.length > 0 ? combined : db.select().from(products).limit(limit);
}

export async function getProductBySlug(slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getAllProductSlugs() {
  return db.select({ slug: products.slug, updatedAt: products.updatedAt }).from(products);
}

export async function getRelatedProducts(category: string, excludeSlug?: string, limit = 4) {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.category, category))
    .limit(excludeSlug ? limit + 1 : limit);
  return excludeSlug ? rows.filter((p) => p.slug !== excludeSlug).slice(0, limit) : rows;
}

// ---------- posts ----------
// Every public listing/detail query below is scoped to isPublished = true so
// a draft created in the admin dashboard never appears on the live site
// (including the sitemap), and ordered by sortOrder first — the manual
// order set from the admin Articles page — with publishedAt desc as the
// tiebreaker for posts that share the same order value (e.g. the default 0).
const published = eq(posts.isPublished, true);
const postOrder = [asc(posts.sortOrder), desc(posts.publishedAt)] as const;

export async function getHomeSpreadPosts(limit = 2) {
  const marked = await db
    .select()
    .from(posts)
    .where(and(eq(posts.isHomeSpread, true), published))
    .orderBy(...postOrder)
    .limit(limit);

  if (marked.length >= limit) return marked;

  const excludeIds = new Set(marked.map((p) => p.id));
  const fallback = await db
    .select()
    .from(posts)
    .where(published)
    .orderBy(...postOrder)
    .limit(limit * 2);

  const combined = [...marked];
  for (const p of fallback) {
    if (!excludeIds.has(p.id) && combined.length < limit) {
      combined.push(p);
    }
  }
  return combined;
}

export async function getNewHomePosts() {
  return db.select().from(posts).where(and(eq(posts.isNewHome, true), published)).orderBy(...postOrder).limit(4);
}

export async function getHomeBlogPreview() {
  return db.select().from(posts).where(and(eq(posts.isHomePreview, true), published)).orderBy(...postOrder).limit(3);
}

export async function getHomeReviews() {
  return db.select().from(posts).where(and(eq(posts.isHomeReview, true), published)).orderBy(...postOrder).limit(3);
}

export async function getRecentBlogPosts() {
  return db.select().from(posts).where(and(eq(posts.isRecentBlog, true), published)).orderBy(...postOrder).limit(4);
}

export async function getSideStories() {
  return db.select().from(posts).where(and(eq(posts.isSideStory, true), published)).orderBy(...postOrder).limit(2);
}

export async function getHomeHeroPost() {
  const rows = await db
    .select()
    .from(posts)
    .where(and(or(eq(posts.isHomeSpread, true), eq(posts.isHomeGuide, true)), published))
    .orderBy(...postOrder)
    .limit(1);
  if (rows[0]) return rows[0];
  const fallback = await db
    .select()
    .from(posts)
    .where(published)
    .orderBy(...postOrder)
    .limit(1);
  return fallback[0] ?? null;
}

export async function getHomeGuidePost() {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.isHomeGuide, true), published))
    .orderBy(...postOrder)
    .limit(1);
  if (rows[0]) return rows[0];
  const fallback = await db
    .select()
    .from(posts)
    .where(published)
    .orderBy(...postOrder)
    .limit(1);
  return fallback[0] ?? null;
}

export async function getDealsHeroPost() {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.isDealsPreview, true), published))
    .orderBy(...postOrder)
    .limit(1);
  if (rows[0]) return rows[0];

  const fallback = await db
    .select()
    .from(posts)
    .where(published)
    .orderBy(...postOrder)
    .limit(1);
  return fallback[0] ?? null;
}

export async function getDealsBlogPreview() {
  return db.select().from(posts).where(and(eq(posts.isDealsPreview, true), published)).orderBy(...postOrder).limit(3);
}

export async function getAllDealsBlogPosts(limit?: number) {
  const query = db
    .select()
    .from(posts)
    .where(and(or(eq(posts.isDealsPreview, true), eq(posts.isHomeSpread, true), eq(posts.isHomeReview, true), eq(posts.isHomeGuide, true)), published))
    .orderBy(...postOrder);
  return limit ? query.limit(limit) : query;
}


export async function getPostsByCategory(category: string, limit = 4, excludeSlug?: string) {
  const rows = await db
    .select()
    .from(posts)
    .where(and(sql`LOWER(${posts.category}) = LOWER(${category})`, published))
    .orderBy(...postOrder)
    .limit(excludeSlug ? limit + 1 : limit);
  return excludeSlug ? rows.filter((p) => p.slug !== excludeSlug).slice(0, limit) : rows;
}

export async function getCategoryOrAllPosts(category?: string, limit = 100) {
  if (!category || category.toLowerCase() === "all") {
    return db.select().from(posts).where(published).orderBy(...postOrder).limit(limit);
  }
  return db
    .select()
    .from(posts)
    .where(and(sql`LOWER(${posts.category}) = LOWER(${category})`, published))
    .orderBy(...postOrder)
    .limit(limit);
}


export async function getAllPostSlugs() {
  return db
    .select({ slug: posts.slug, publishedAt: posts.publishedAt, updatedAt: posts.updatedAt })
    .from(posts)
    .where(published);
}

export async function getPostBySlug(slug: string) {
  const rows = await db.select().from(posts).where(and(eq(posts.slug, slug), published)).limit(1);
  return rows[0] ?? null;
}

export async function getRelatedPosts(category: string, excludeSlug: string, limit = 3) {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.category, category), published))
    .orderBy(...postOrder)
    .limit(limit + 1);
  return rows.filter((p) => p.slug !== excludeSlug).slice(0, limit);
}

export async function getLatestPosts(limit = 4) {
  return db.select().from(posts).where(published).orderBy(...postOrder).limit(limit);
}

export async function getAllPublishedPosts(limit = 50) {
  return db.select().from(posts).where(published).orderBy(...postOrder).limit(limit);
}

export async function getFeaturedPost() {
  const rows = await db
    .select()
    .from(posts)
    .where(and(or(eq(posts.category, "CARE"), eq(posts.isHomeSpread, true)), published))
    .orderBy(...postOrder)
    .limit(1);
  if (rows[0]) return rows[0];
  const fallback = await db.select().from(posts).where(published).orderBy(...postOrder).limit(1);
  return fallback[0] ?? null;
}

// ---------- site categories ----------
export async function getHeaderCategories() {
  return db
    .select()
    .from(siteCategories)
    .where(and(eq(siteCategories.section, "header"), eq(siteCategories.isActive, true)))
    .orderBy(asc(siteCategories.sortOrder), asc(siteCategories.id));
}

export async function getSidebarCategories() {
  return db.select().from(siteCategories).where(eq(siteCategories.section, "sidebar")).orderBy(asc(siteCategories.sortOrder));
}

export async function getExploreCategories() {
  return db.select().from(siteCategories).where(eq(siteCategories.section, "explore")).orderBy(asc(siteCategories.sortOrder));
}

export async function getCategoryBySlug(slug: string) {
  const all = await db.select().from(siteCategories);
  const found = all.find(
    (c) =>
      (c.slug && c.slug.toLowerCase() === slug.toLowerCase()) ||
      slugify(c.label) === slug.toLowerCase()
  );
  return found ?? null;
}

export async function getAllCategorySlugs() {
  const rows = await db.select({ slug: siteCategories.slug, label: siteCategories.label }).from(siteCategories);
  return rows.map((r) => r.slug || slugify(r.label)).filter(Boolean);
}

export async function getCategoryArticles(categoryTerms: string[]) {
  const allPosts = await db.select().from(posts).where(published).orderBy(...postOrder);
  if (categoryTerms.length === 0) return allPosts.slice(0, 8);

  const lowerTerms = categoryTerms.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const wordTokens = lowerTerms.flatMap((t) => t.split(/[^a-z0-9]+/i).filter((w) => w.length > 3));

  const matched = allPosts.filter((p) => {
    const pCat = (p.category || "").toLowerCase();
    const pTopic = (p.topicLabel || "").toLowerCase();
    const pTitle = (p.title || "").toLowerCase();
    const pExcerpt = (p.excerpt || "").toLowerCase();

    // 1. Check direct phrase match
    const phraseMatch = lowerTerms.some(
      (term) =>
        (pCat && (pCat.includes(term) || term.includes(pCat))) ||
        (pTopic && (pTopic.includes(term) || term.includes(pTopic))) ||
        pTitle.includes(term) ||
        pExcerpt.includes(term)
    );
    if (phraseMatch) return true;

    // 2. Check individual word tokens
    const tokenMatch = wordTokens.some(
      (token) =>
        pCat.includes(token) ||
        token.includes(pCat) ||
        pTopic.includes(token) ||
        pTitle.includes(token)
    );
    if (tokenMatch) return true;

    // 3. Check recommended products associated with this article
    const recProds = p.structuredContent?.recommendedProducts || [];
    const productMatch = recProds.some((rp) => {
      const rpName = (rp.name || "").toLowerCase();
      const rpSubtitle = (rp.subtitle || "").toLowerCase();
      return (
        lowerTerms.some((term) => rpName.includes(term) || rpSubtitle.includes(term)) ||
        wordTokens.some((tok) => rpName.includes(tok))
      );
    });
    if (productMatch) return true;

    return false;
  });

  return matched;
}

export async function getCategoryProducts(categoryTerms: string[]) {
  const allProducts = await db.select().from(products).orderBy(asc(products.id));
  if (categoryTerms.length === 0) return allProducts;

  const lowerTerms = categoryTerms.map((t) => t.toLowerCase().trim()).filter(Boolean);
  const wordTokens = lowerTerms.flatMap((t) => t.split(/[^a-z0-9]+/i).filter((w) => w.length > 3));

  const matched = allProducts.filter((p) => {
    const pCat = (p.category || "").toLowerCase();
    const pName = (p.name || "").toLowerCase();
    const pSubtitle = (p.subtitle || "").toLowerCase();

    const phraseMatch = lowerTerms.some(
      (term) =>
        (pCat && (pCat.includes(term) || term.includes(pCat))) ||
        pName.includes(term) ||
        term.includes(pName) ||
        pSubtitle.includes(term)
    );
    if (phraseMatch) return true;

    return wordTokens.some((token) => (pCat && pCat.includes(token)) || pName.includes(token));
  });

  return matched;
}

export async function getProductToArticleMap(): Promise<Record<string, { slug: string; title: string }>> {
  const allPosts = await db.select().from(posts).where(published);
  const map: Record<string, { slug: string; title: string }> = {};

  for (const post of allPosts) {
    const sc = post.structuredContent;
    if (sc && Array.isArray(sc.recommendedProducts)) {
      for (const rec of sc.recommendedProducts) {
        if (rec.name) {
          map[rec.name.toLowerCase().trim()] = {
            slug: post.slug,
            title: post.title,
          };
        }
      }
    }
    if (sc && Array.isArray(sc.keywordLinks)) {
      for (const kw of sc.keywordLinks) {
        if (kw.keyword) {
          map[kw.keyword.toLowerCase().trim()] = {
            slug: post.slug,
            title: post.title,
          };
        }
      }
    }
  }

  return map;
}

export function findRelatedArticleForProduct(
  productName: string,
  map: Record<string, { slug: string; title: string }>
): { slug: string; title: string } | null {
  if (!productName || !map) return null;
  const clean = productName.toLowerCase().trim();

  // 1. Direct key match
  if (map[clean]) return map[clean];

  // 2. Substring matching
  for (const [key, articleInfo] of Object.entries(map)) {
    if (key.length >= 4 && (clean.includes(key) || key.includes(clean))) {
      return articleInfo;
    }
  }

  // 3. Multi-word overlap matching
  const words = clean.split(/[^a-z0-9]+/i).filter((w) => w.length > 3);
  if (words.length > 0) {
    for (const [key, articleInfo] of Object.entries(map)) {
      const keyWords = key.split(/[^a-z0-9]+/i).filter((w) => w.length > 3);
      const matchCount = words.filter((w) => keyWords.includes(w)).length;
      if (matchCount >= 2 || (words.length === 1 && matchCount === 1)) {
        return articleInfo;
      }
    }
  }

  return null;
}

// ---------- community ----------
const originalPosts = alias(communityPosts, "original_posts");
const originalUser = alias(user, "original_user");
const originalArticle = alias(posts, "original_article");
const originalProduct = alias(products, "original_product");
const commentPostAuthor = alias(user, "comment_post_author");

const postWithAuthor = {
  id: communityPosts.id,
  body: communityPosts.body,
  imageLabel: communityPosts.imageLabel,
  hasImage: communityPosts.hasImage,
  imageUrl: communityPosts.imageUrl,
  images: communityPosts.images,
  collageData: communityPosts.collageData,
  productId: communityPosts.productId,
  repostOfId: communityPosts.repostOfId,
  articleId: communityPosts.articleId,
  postedAt: communityPosts.postedAt,
  commentCount: communityPosts.commentCount,
  repostCount: communityPosts.repostCount,
  likeCount: communityPosts.likeCount,
  authorName: user.name,
  authorHandle: user.handle,
  authorImage: user.image,
  originalAuthorName: originalUser.name,
  originalAuthorHandle: originalUser.handle,
  originalAuthorImage: originalUser.image,
  originalBody: originalPosts.body,
  originalImageLabel: originalPosts.imageLabel,
  originalHasImage: originalPosts.hasImage,
  originalImageUrl: originalPosts.imageUrl,
  originalImages: originalPosts.images,
  originalCollageData: originalPosts.collageData,
  originalPostedAt: originalPosts.postedAt,
  originalRepostOfId: originalPosts.repostOfId,
  // Attached Article Details
  articleTitle: posts.title,
  articleSlug: posts.slug,
  articleExcerpt: posts.excerpt,
  articleImageUrl: posts.imageUrl,
  articleImageLabel: posts.imageLabel,
  articleCategory: posts.category,
  articleAuthor: posts.author,
  // Attached Article Details (for original post in reposts)
  originalArticleId: originalPosts.articleId,
  originalArticleTitle: originalArticle.title,
  originalArticleSlug: originalArticle.slug,
  originalArticleExcerpt: originalArticle.excerpt,
  originalArticleImageUrl: originalArticle.imageUrl,
  originalArticleImageLabel: originalArticle.imageLabel,
  originalArticleCategory: originalArticle.category,
  originalArticleAuthor: originalArticle.author,
  // Attached Product Details (for direct posts)
  productName: products.name,
  productSlug: products.slug,
  productSubtitle: products.subtitle,
  productImageUrl: products.imageUrl,
  productImageLabel: products.imageLabel,
  productCategory: products.category,
  productPriceCents: products.priceCents,
  productCompareAtPriceCents: products.compareAtPriceCents,
  productDiscountPercent: products.discountPercent,
  productBadge: products.badge,
  productInStock: products.inStock,
  productAffiliateUrl: products.affiliateUrl,
  // Attached Product Details (for original post in reposts)
  originalProductId: originalPosts.productId,
  originalProductName: originalProduct.name,
  originalProductSlug: originalProduct.slug,
  originalProductSubtitle: originalProduct.subtitle,
  originalProductImageUrl: originalProduct.imageUrl,
  originalProductImageLabel: originalProduct.imageLabel,
  originalProductCategory: originalProduct.category,
  originalProductPriceCents: originalProduct.priceCents,
  originalProductCompareAtPriceCents: originalProduct.compareAtPriceCents,
  originalProductDiscountPercent: originalProduct.discountPercent,
  originalProductBadge: originalProduct.badge,
  originalProductInStock: originalProduct.inStock,
  originalProductAffiliateUrl: originalProduct.affiliateUrl,
};

/**
 * Resolves any nested / bare reposts in the result set so that if a post
 * quotes or reposts another bare repost, it automatically inherits and displays
 * the root original post's author, text, image, and article instead of being empty.
 */
async function resolveRepostChains<T extends {
  repostOfId: number | null;
  originalRepostOfId?: number | null;
  originalBody?: string | null;
  originalHasImage?: boolean | null;
  originalImageUrl?: string | null;
  originalImages?: string[] | null;
  originalImageLabel?: string | null;
  originalCollageData?: any | null;
  originalAuthorName?: string | null;
  originalAuthorHandle?: string | null;
  originalAuthorImage?: string | null;
  originalPostedAt?: Date | null;
  originalArticleId?: number | null;
  originalArticleTitle?: string | null;
  originalArticleSlug?: string | null;
  originalArticleExcerpt?: string | null;
  originalArticleImageUrl?: string | null;
  originalArticleImageLabel?: string | null;
  originalArticleCategory?: string | null;
  originalArticleAuthor?: string | null;
  originalProductId?: number | null;
  originalProductName?: string | null;
  originalProductSlug?: string | null;
  originalProductSubtitle?: string | null;
  originalProductImageUrl?: string | null;
  originalProductImageLabel?: string | null;
  originalProductCategory?: string | null;
  originalProductPriceCents?: number | null;
  originalProductCompareAtPriceCents?: number | null;
  originalProductDiscountPercent?: number | null;
  originalProductBadge?: string | null;
  originalProductInStock?: boolean | null;
  originalProductAffiliateUrl?: string | null;
}>(items: T[]): Promise<T[]> {
  const needsResolution = items.filter(
    (item) => item.repostOfId && item.originalRepostOfId && (!item.originalBody || !item.originalBody.trim()) && !item.originalHasImage && !item.originalArticleTitle && !item.originalProductName
  );

  if (needsResolution.length === 0) return items;

  let pending = [...needsResolution];
  let depth = 0;

  while (pending.length > 0 && depth < 5) {
    depth++;
    const targetIds = Array.from(new Set(pending.map((p) => p.originalRepostOfId!).filter(Boolean)));
    if (targetIds.length === 0) break;

    const rootRows = await db
      .select({
        id: communityPosts.id,
        body: communityPosts.body,
        imageLabel: communityPosts.imageLabel,
        hasImage: communityPosts.hasImage,
        imageUrl: communityPosts.imageUrl,
        images: communityPosts.images,
        collageData: communityPosts.collageData,
        repostOfId: communityPosts.repostOfId,
        postedAt: communityPosts.postedAt,
        authorName: user.name,
        authorHandle: user.handle,
        authorImage: user.image,
        articleId: posts.id,
        articleTitle: posts.title,
        articleSlug: posts.slug,
        articleExcerpt: posts.excerpt,
        articleImageUrl: posts.imageUrl,
        articleImageLabel: posts.imageLabel,
        articleCategory: posts.category,
        articleAuthor: posts.author,
        productId: products.id,
        productName: products.name,
        productSlug: products.slug,
        productSubtitle: products.subtitle,
        productImageUrl: products.imageUrl,
        productImageLabel: products.imageLabel,
        productCategory: products.category,
        productPriceCents: products.priceCents,
        productCompareAtPriceCents: products.compareAtPriceCents,
        productDiscountPercent: products.discountPercent,
        productBadge: products.badge,
        productInStock: products.inStock,
        productAffiliateUrl: products.affiliateUrl,
      })
      .from(communityPosts)
      .innerJoin(user, eq(communityPosts.userId, user.id))
      .leftJoin(posts, eq(communityPosts.articleId, posts.id))
      .leftJoin(products, eq(communityPosts.productId, products.id))
      .where(inArray(communityPosts.id, targetIds));

    const rootMap = new Map(rootRows.map((r) => [r.id, r]));
    const nextPending: typeof pending = [];

    for (const item of pending) {
      const root = item.originalRepostOfId ? rootMap.get(item.originalRepostOfId) : undefined;
      if (root) {
        item.repostOfId = root.id;
        item.originalAuthorName = root.authorName;
        item.originalAuthorHandle = root.authorHandle;
        item.originalAuthorImage = root.authorImage;
        item.originalBody = root.body;
        item.originalHasImage = root.hasImage;
        item.originalImageUrl = root.imageUrl;
        item.originalImages = root.images;
        item.originalCollageData = root.collageData;
        item.originalImageLabel = root.imageLabel;
        item.originalPostedAt = root.postedAt;
        item.originalArticleId = root.articleId;
        item.originalArticleTitle = root.articleTitle;
        item.originalArticleSlug = root.articleSlug;
        item.originalArticleExcerpt = root.articleExcerpt;
        item.originalArticleImageUrl = root.articleImageUrl;
        item.originalArticleImageLabel = root.articleImageLabel;
        item.originalArticleCategory = root.articleCategory;
        item.originalArticleAuthor = root.articleAuthor;
        item.originalProductId = root.productId;
        item.originalProductName = root.productName;
        item.originalProductSlug = root.productSlug;
        item.originalProductSubtitle = root.productSubtitle;
        item.originalProductImageUrl = root.productImageUrl;
        item.originalProductImageLabel = root.productImageLabel;
        item.originalProductCategory = root.productCategory;
        item.originalProductPriceCents = root.productPriceCents;
        item.originalProductCompareAtPriceCents = root.productCompareAtPriceCents;
        item.originalProductDiscountPercent = root.productDiscountPercent;
        item.originalProductBadge = root.productBadge;
        item.originalProductInStock = root.productInStock;
        item.originalProductAffiliateUrl = root.productAffiliateUrl;
        item.originalRepostOfId = root.repostOfId;

        if (root.repostOfId && (!root.body || !root.body.trim()) && !root.hasImage && !root.articleTitle && !root.productName) {
          nextPending.push(item);
        }
      }
    }
    pending = nextPending;
  }

  return items;
}

export async function getCommunityFeed(limit = 10) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
  return resolveRepostChains(rows);
}

/**
 * Returns community posts with non-empty commentary/opinion,
 * filtering out bare reposts without thoughts or commentary.
 */
export async function getCommunityBuzzPosts(limit = 3) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(and(ne(communityPosts.body, ""), sql`trim(${communityPosts.body}) != ''`))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
  return resolveRepostChains(rows);
}

export interface FeaturedCommunityComment {
  id: number;
  postId: number;
  body: string;
  imageUrl: string | null;
  likeCount: number;
  createdAt: Date;
  authorName: string;
  authorHandle: string;
  authorImage: string | null;
  postBody: string;
  postAuthorName: string | null;
  postAuthorHandle: string | null;
}

/**
 * Returns community posts ranked strictly by engagement evaluated over the last 24 hours
 * (highest likes, comments, and reposts in the last 24 hours, falling back to overall highest).
 */
export async function getTopCommunityPosts(limit = 10) {
  const scoreExpr = sql<number>`(
    (
      COALESCE((SELECT COUNT(*) FROM "likes" WHERE "likes"."post_id" = "community_posts"."id" AND "likes"."created_at" >= NOW() - INTERVAL '24 hours'), 0) * 3 +
      COALESCE((SELECT COUNT(*) FROM "comments" WHERE "comments"."post_id" = "community_posts"."id" AND "comments"."created_at" >= NOW() - INTERVAL '24 hours'), 0) * 2 +
      COALESCE((SELECT COUNT(*) FROM "community_posts" cp_rep WHERE cp_rep."repost_of_id" = "community_posts"."id" AND cp_rep."posted_at" >= NOW() - INTERVAL '24 hours'), 0) * 3 +
      CASE WHEN "community_posts"."posted_at" >= NOW() - INTERVAL '24 hours' THEN ("community_posts"."like_count" * 3 + "community_posts"."comment_count" * 2 + "community_posts"."repost_count" * 3) ELSE 0 END
    ) * 1000 +
    ("community_posts"."like_count" * 3 + "community_posts"."comment_count" * 2 + "community_posts"."repost_count" * 3)
  )`;

  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(and(ne(communityPosts.body, ""), sql`trim(${communityPosts.body}) != ''`))
    .orderBy(desc(scoreExpr), desc(communityPosts.postedAt))
    .limit(limit);

  return resolveRepostChains(rows);
}

/**
 * Returns community comments ranked strictly by engagement evaluated over the last 24 hours
 * (highest likes and reactions in the last 24 hours, falling back to overall highest likes).
 */
export async function getTopCommunityComments(limit = 10): Promise<FeaturedCommunityComment[]> {
  const commentScoreExpr = sql<number>`(
    (
      COALESCE((SELECT COUNT(*) FROM "comment_reactions" cr WHERE cr."comment_id" = "comments"."id" AND cr."type" = 'like' AND cr."created_at" >= NOW() - INTERVAL '24 hours'), 0) * 3 +
      CASE WHEN "comments"."created_at" >= NOW() - INTERVAL '24 hours' THEN "comments"."like_count" * 3 ELSE 0 END
    ) * 1000 +
    "comments"."like_count"
  )`;

  const rows = await db
    .select({
      id: comments.id,
      postId: comments.postId,
      body: comments.body,
      imageUrl: comments.imageUrl,
      likeCount: comments.likeCount,
      createdAt: comments.createdAt,
      authorName: user.name,
      authorHandle: user.handle,
      authorImage: user.image,
      postBody: communityPosts.body,
      postAuthorName: commentPostAuthor.name,
      postAuthorHandle: commentPostAuthor.handle,
    })
    .from(comments)
    .innerJoin(user, eq(comments.userId, user.id))
    .innerJoin(communityPosts, eq(comments.postId, communityPosts.id))
    .leftJoin(commentPostAuthor, eq(communityPosts.userId, commentPostAuthor.id))
    .where(and(ne(comments.body, ""), sql`trim(${comments.body}) != ''`))
    .orderBy(desc(commentScoreExpr), desc(comments.createdAt))
    .limit(limit);

  return rows;
}

export type CommunityHighlightItem =
  | { type: "post"; post: any }
  | { type: "comment"; comment: FeaturedCommunityComment };

export interface DailyHomeCommunityHighlights {
  sidebarItem: CommunityHighlightItem | null;
  bannerPost: any | null;
  readerComment: FeaturedCommunityComment | null;
  spotlightItems: CommunityHighlightItem[];
  spotlightItem?: CommunityHighlightItem | null;
}

/**
 * Evaluates the top-performing community posts and comments over the last 24 hours
 * and assigns them to scattered locations on the homepage.
 *
 * Guarantees that the highest-ranked post and highest-ranked comment are always
 * prominently featured, while distributing other top items across the page.
 */
export async function getDailyHomeCommunityHighlights(): Promise<DailyHomeCommunityHighlights> {
  const [topPosts, topComments] = await Promise.all([
    getTopCommunityPosts(6),
    getTopCommunityComments(6),
  ]);

  // #1 Post is always the featured Banner post (most prominent position)
  const bannerPost = topPosts[0] ?? null;

  // #1 Comment is always the featured Reader Take quote
  const readerComment = topComments[0] ?? null;

  // For hero sidebar, alternate daily between #2 Post and #2 Comment
  const dayEpoch = Math.floor(Date.now() / 86400000);
  const alternate = dayEpoch % 2 === 0;

  const post2 = topPosts[1] ?? null;
  const comment2 = topComments[1] ?? null;

  let sidebarItem: CommunityHighlightItem | null = null;

  if (alternate) {
    if (post2) {
      sidebarItem = { type: "post", post: post2 };
    } else if (comment2) {
      sidebarItem = { type: "comment", comment: comment2 };
    }
  } else {
    if (comment2) {
      sidebarItem = { type: "comment", comment: comment2 };
    } else if (post2) {
      sidebarItem = { type: "post", post: post2 };
    }
  }

  // Community Buzz: always display 2 items side-by-side
  const spotlightItems: CommunityHighlightItem[] = [];
  const usedPostIds = new Set<string>();
  const usedCommentIds = new Set<number>();

  if (bannerPost?.id) usedPostIds.add(String(bannerPost.id));
  if (readerComment?.id) usedCommentIds.add(readerComment.id);
  if (sidebarItem?.type === "post" && sidebarItem.post?.id) usedPostIds.add(String(sidebarItem.post.id));
  if (sidebarItem?.type === "comment" && sidebarItem.comment?.id) usedCommentIds.add(sidebarItem.comment.id);

  const remainingComments = topComments.filter((c) => !usedCommentIds.has(c.id));
  const remainingPosts = topPosts.filter((p) => !usedPostIds.has(String(p.id)));

  // Ideally display 1 comment and 1 post in Community Buzz for visual and conversational balance
  if (alternate) {
    if (remainingComments[0]) spotlightItems.push({ type: "comment", comment: remainingComments[0] });
    if (remainingPosts[0]) spotlightItems.push({ type: "post", post: remainingPosts[0] });
  } else {
    if (remainingPosts[0]) spotlightItems.push({ type: "post", post: remainingPosts[0] });
    if (remainingComments[0]) spotlightItems.push({ type: "comment", comment: remainingComments[0] });
  }

  // Fill up to 2 items if one category ran out
  for (const c of remainingComments) {
    if (spotlightItems.length >= 2) break;
    if (!spotlightItems.some((item) => item.type === "comment" && item.comment.id === c.id)) {
      spotlightItems.push({ type: "comment", comment: c });
    }
  }
  for (const p of remainingPosts) {
    if (spotlightItems.length >= 2) break;
    if (!spotlightItems.some((item) => item.type === "post" && item.post.id === p.id)) {
      spotlightItems.push({ type: "post", post: p });
    }
  }

  // Graceful fallback for sparse databases: use any available top posts or comments
  for (const p of topPosts) {
    if (spotlightItems.length >= 2) break;
    if (!spotlightItems.some((item) => item.type === "post" && item.post.id === p.id)) {
      spotlightItems.push({ type: "post", post: p });
    }
  }
  for (const c of topComments) {
    if (spotlightItems.length >= 2) break;
    if (!spotlightItems.some((item) => item.type === "comment" && item.comment.id === c.id)) {
      spotlightItems.push({ type: "comment", comment: c });
    }
  }

  return {
    sidebarItem,
    bannerPost,
    readerComment,
    spotlightItems,
    spotlightItem: spotlightItems[0] ?? null,
  };
}

export async function getPostsByHandle(handle: string, limit = 10) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(eq(user.handle, handle))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
  return resolveRepostChains(rows);
}

export async function getPostById(id: number) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(eq(communityPosts.id, id))
    .limit(1);
  const resolved = await resolveRepostChains(rows);
  return resolved[0] ?? null;
}

export async function getCollagePostById(id: number) {
  return getPostById(id);
}

export async function getUserByHandle(handle: string) {
  const rows = await db.select().from(user).where(eq(user.handle, handle)).limit(1);
  return rows[0] ?? null;
}

export async function getCommentsForPost(postId: number, viewerId?: string | null) {
  const commentRows = await db
    .select({
      id: comments.id,
      body: comments.body,
      imageUrl: comments.imageUrl,
      likeCount: comments.likeCount,
      dislikeCount: comments.dislikeCount,
      createdAt: comments.createdAt,
      parentId: comments.parentId,
      userId: comments.userId,
      authorName: user.name,
      authorHandle: user.handle,
      authorImage: user.image,
    })
    .from(comments)
    .innerJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));

  if (!viewerId || commentRows.length === 0) {
    return commentRows.map((c) => ({
      ...c,
      userReaction: null as "like" | "dislike" | null,
    }));
  }

  const commentIds = commentRows.map((c) => c.id);
  const reactions = await db
    .select({
      commentId: commentReactions.commentId,
      type: commentReactions.type,
    })
    .from(commentReactions)
    .where(
      and(
        inArray(commentReactions.commentId, commentIds),
        eq(commentReactions.userId, viewerId),
      ),
    );

  const reactionMap = new Map(reactions.map((r) => [r.commentId, r.type as "like" | "dislike"]));

  return commentRows.map((c) => ({
    ...c,
    userReaction: reactionMap.get(c.id) ?? null,
  }));
}

export async function hasUserLikedPost(postId: number, userId: string) {
  const rows = await db
    .select()
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function hasUserRepostedPost(postId: number, userId: string) {
  const rows = await db
    .select()
    .from(communityPosts)
    .where(and(eq(communityPosts.repostOfId, postId), eq(communityPosts.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function getLikedPostIds(postIds: number[], userId: string): Promise<Set<number>> {
  if (postIds.length === 0) return new Set();
  const rows = await db.select({ postId: likes.postId }).from(likes).where(and(eq(likes.userId, userId)));
  const idSet = new Set(postIds);
  return new Set(rows.map((r) => r.postId).filter((id) => idSet.has(id)));
}

export async function isUserFollowing(followerId?: string | null, followingId?: string | null): Promise<boolean> {
  if (!followerId || !followingId || followerId === followingId) return false;
  const rows = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return rows.length > 0;
}

export async function getFollowCounts(userId: string): Promise<{ followersCount: number; followingCount: number }> {
  const [followersRow, followingRow] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followingId, userId)),
    db.select({ count: sql<number>`count(*)::int` }).from(follows).where(eq(follows.followerId, userId)),
  ]);
  return {
    followersCount: followersRow[0]?.count ?? 0,
    followingCount: followingRow[0]?.count ?? 0,
  };
}

export async function getRepostedPostIds(userId: string): Promise<Set<number>> {
  const rows = await db
    .select({ repostOfId: communityPosts.repostOfId })
    .from(communityPosts)
    .where(eq(communityPosts.userId, userId));
  return new Set(rows.map((r) => r.repostOfId).filter((id): id is number => id !== null));
}

export async function getPeopleSuggestions(excludeUserId?: string, limit = 3) {
  const rows = await db.select().from(user).orderBy(desc(user.createdAt)).limit(limit + 1);
  return rows.filter((u) => u.id !== excludeUserId).slice(0, limit);
}

export async function getMediaPostsByHandle(handle: string, limit = 20) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(and(eq(user.handle, handle), eq(communityPosts.hasImage, true)))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
  return resolveRepostChains(rows);
}

/** Posts a given user has liked — shows the post's actual author, not the liker. */
export async function getLikedPostsByUserId(userId: string, limit = 20) {
  const rows = await db
    .select(postWithAuthor)
    .from(likes)
    .innerJoin(communityPosts, eq(likes.postId, communityPosts.id))
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .leftJoin(originalPosts, eq(communityPosts.repostOfId, originalPosts.id))
    .leftJoin(originalUser, eq(originalPosts.userId, originalUser.id))
    .leftJoin(posts, eq(communityPosts.articleId, posts.id))
    .leftJoin(originalArticle, eq(originalPosts.articleId, originalArticle.id))
    .leftJoin(products, eq(communityPosts.productId, products.id))
    .leftJoin(originalProduct, eq(originalPosts.productId, originalProduct.id))
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt))
    .limit(limit);
  return resolveRepostChains(rows);
}

/** Comments a given user has left on (anyone's) posts, with enough of the
 * parent post to link back to it and show who they replied to. */
export async function getCommentsByUserId(userId: string, limit = 20) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      postId: comments.postId,
      postAuthorName: user.name,
      postAuthorHandle: user.handle,
    })
    .from(comments)
    .innerJoin(communityPosts, eq(comments.postId, communityPosts.id))
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .where(eq(comments.userId, userId))
    .orderBy(desc(comments.createdAt))
    .limit(limit);
}

export async function getCommunityPostCountByUserId(userId: string) {
  const rows = await db.select({ count: sql<number>`count(*)::int` }).from(communityPosts).where(eq(communityPosts.userId, userId));
  return rows[0]?.count ?? 0;
}

export async function getAllCommunityPostIds() {
  // Excludes bare reposts (empty body, repostOfId set) — those pages are
  // noindex (see the repost detection in app/community/post/[id]/page.tsx),
  // so they're kept out of the sitemap too.
  return db
    .select({ id: communityPosts.id, postedAt: communityPosts.postedAt })
    .from(communityPosts)
    .where(or(isNull(communityPosts.repostOfId), ne(communityPosts.body, "")));
}

export async function getAllUserHandles() {
  return db.select({ handle: user.handle, createdAt: user.createdAt }).from(user);
}

export async function getTrends() {
  return db.select().from(trends).orderBy(desc(trends.postCount));
}

export function formatTrendCount(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

// ---------- advertising banners ----------
export async function getActiveBanners(placement = "community_banner") {
  return db
    .select()
    .from(banners)
    .where(and(eq(banners.isActive, true), eq(banners.placement, placement)))
    .orderBy(asc(banners.sortOrder), asc(banners.id));
}



// ---------- search & suggestions ----------
export async function searchSuggestions(rawQuery: string) {
  const query = (rawQuery || "").trim();
  if (!query) {
    return {
      products: [],
      posts: [],
      totalCount: 0,
    };
  }

  const qPattern = `%${query}%`;

  const [matchingProducts, matchingPosts] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        or(
          ilike(products.name, qPattern),
          ilike(products.subtitle, qPattern),
          ilike(products.category, qPattern),
          ilike(products.badge, qPattern),
          ilike(products.imageLabel, qPattern)
        )
      )
      .orderBy(desc(products.isFeaturedHome), desc(products.isBestSeller), desc(products.createdAt))
      .limit(6),
    db
      .select()
      .from(posts)
      .where(
        or(
          ilike(posts.title, qPattern),
          ilike(posts.excerpt, qPattern),
          ilike(posts.category, qPattern),
          ilike(posts.topicLabel, qPattern),
          ilike(posts.author, qPattern)
        )
      )
      .orderBy(desc(posts.publishedAt))
      .limit(6),
  ]);

  return {
    products: matchingProducts,
    posts: matchingPosts,
    totalCount: matchingProducts.length + matchingPosts.length,
  };
}

export async function getAllProductsForSearch() {
  return db
    .select()
    .from(products)
    .orderBy(desc(products.isFeaturedHome), desc(products.isBestSeller), desc(products.createdAt));
}

export async function getAllPostsForSearch() {
  return db
    .select()
    .from(posts)
    .orderBy(desc(posts.publishedAt));
}

// ---------- notifications ----------

export interface NotificationItem {
  id: number;
  userId: string;
  actorId: string | null;
  actorName: string | null;
  actorHandle: string | null;
  actorImage: string | null;
  type: string;
  title: string;
  message: string | null;
  targetUrl: string;
  imageUrl: string | null;
  entityId: number | null;
  isRead: boolean;
  createdAt: Date;
}

export async function getNotificationsForUser(
  userId: string,
  options?: { limit?: number; offset?: number; unreadOnly?: boolean; typeFilter?: string }
): Promise<NotificationItem[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const conditions = [eq(notifications.userId, userId)];

  if (options?.unreadOnly) {
    conditions.push(eq(notifications.isRead, false));
  }

  if (options?.typeFilter === "social") {
    conditions.push(
      inArray(notifications.type, ["post_reply", "comment_reply", "new_follower", "post_like", "post_repost"])
    );
  } else if (options?.typeFilter === "system") {
    conditions.push(
      inArray(notifications.type, ["site_article", "site_deal", "site_banner", "system"])
    );
  } else if (options?.typeFilter && options.typeFilter !== "all") {
    conditions.push(eq(notifications.type, options.typeFilter as any));
  }

  const rows = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      actorId: notifications.actorId,
      actorName: user.name,
      actorHandle: user.handle,
      actorImage: user.image,
      type: notifications.type,
      title: notifications.title,
      message: notifications.message,
      targetUrl: notifications.targetUrl,
      imageUrl: notifications.imageUrl,
      entityId: notifications.entityId,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .leftJoin(user, eq(notifications.actorId, user.id))
    .where(and(...conditions))
    .orderBy(desc(notifications.createdAt))
    .limit(limit)
    .offset(offset);

  return rows;
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [res] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));

  return res?.count ?? 0;
}



