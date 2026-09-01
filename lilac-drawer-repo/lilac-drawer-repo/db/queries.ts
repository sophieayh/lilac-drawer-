import "server-only";
import { desc, eq, asc, and, or, isNull, ne, sql } from "drizzle-orm";
import { db } from "./index";
import { products, posts, siteCategories, communityPosts, trends, user, comments, likes } from "./schema";

// ---------- formatting helpers ----------
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export function formatPriceFixed(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
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
export async function getHomeFeaturedDeals() {
  return db.select().from(products).where(eq(products.isFeaturedHome, true)).limit(3);
}

export async function getTopPicks() {
  return db.select().from(products).where(eq(products.isTopPick, true)).orderBy(asc(products.rank)).limit(4);
}

export async function getFeatureProducts() {
  return db.select().from(products).where(eq(products.isFeaturedDeals, true)).limit(6);
}

export async function getSaleOffProducts() {
  return db.select().from(products).where(eq(products.isSaleOff, true)).limit(3);
}

export async function getTodayDeals() {
  return db.select().from(products).where(eq(products.isTodayDeal, true)).limit(4);
}

export async function getNewArrivals() {
  return db.select().from(products).where(eq(products.isNewArrival, true)).limit(3);
}

export async function getBestSellers() {
  return db.select().from(products).where(eq(products.isBestSeller, true)).limit(3);
}

export async function getExploreDeals() {
  return db.select().from(products).where(eq(products.isExploreDeal, true)).limit(4);
}

export async function getExploreRecommended() {
  return db.select().from(products).where(eq(products.isRecommended, true)).limit(4);
}

export async function getSavedPicks() {
  return db.select().from(products).where(eq(products.isSaved, true)).limit(4);
}

export async function getSuggestedProducts() {
  return db.select().from(products).where(eq(products.isSuggested, true)).limit(2);
}

// ---------- posts ----------
// Every public listing/detail query below is scoped to isPublished = true so
// a draft created in the admin dashboard never appears on the live site
// (including the sitemap), and ordered by sortOrder first — the manual
// order set from the admin Articles page — with publishedAt desc as the
// tiebreaker for posts that share the same order value (e.g. the default 0).
const published = eq(posts.isPublished, true);
const postOrder = [asc(posts.sortOrder), desc(posts.publishedAt)] as const;

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

export async function getDealsBlogPreview() {
  return db.select().from(posts).where(and(eq(posts.isDealsPreview, true), published)).orderBy(...postOrder).limit(3);
}

export async function getPostsByCategory(category: string, limit = 4, excludeSlug?: string) {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.category, category), published))
    .orderBy(...postOrder)
    .limit(excludeSlug ? limit + 1 : limit);
  return excludeSlug ? rows.filter((p) => p.slug !== excludeSlug).slice(0, limit) : rows;
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

export async function getFeaturedPost() {
  const rows = await db
    .select()
    .from(posts)
    .where(and(eq(posts.category, "CARE"), published))
    .orderBy(...postOrder)
    .limit(1);
  return rows[0] ?? null;
}

// ---------- site categories ----------
export async function getSidebarCategories() {
  return db.select().from(siteCategories).where(eq(siteCategories.section, "sidebar")).orderBy(asc(siteCategories.sortOrder));
}

export async function getExploreCategories() {
  return db.select().from(siteCategories).where(eq(siteCategories.section, "explore")).orderBy(asc(siteCategories.sortOrder));
}

// ---------- community ----------
const postWithAuthor = {
  id: communityPosts.id,
  body: communityPosts.body,
  imageLabel: communityPosts.imageLabel,
  hasImage: communityPosts.hasImage,
  productId: communityPosts.productId,
  repostOfId: communityPosts.repostOfId,
  postedAt: communityPosts.postedAt,
  commentCount: communityPosts.commentCount,
  repostCount: communityPosts.repostCount,
  likeCount: communityPosts.likeCount,
  authorName: user.name,
  authorHandle: user.handle,
  authorImage: user.image,
};

export async function getCommunityFeed(limit = 10) {
  return db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
}

export async function getPostsByHandle(handle: string, limit = 10) {
  return db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .where(eq(user.handle, handle))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
}

export async function getPostById(id: number) {
  const rows = await db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .where(eq(communityPosts.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByHandle(handle: string) {
  const rows = await db.select().from(user).where(eq(user.handle, handle)).limit(1);
  return rows[0] ?? null;
}

export async function getCommentsForPost(postId: number) {
  return db
    .select({
      id: comments.id,
      body: comments.body,
      createdAt: comments.createdAt,
      authorName: user.name,
      authorHandle: user.handle,
    })
    .from(comments)
    .innerJoin(user, eq(comments.userId, user.id))
    .where(eq(comments.postId, postId))
    .orderBy(asc(comments.createdAt));
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
  return db
    .select(postWithAuthor)
    .from(communityPosts)
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .where(and(eq(user.handle, handle), eq(communityPosts.hasImage, true)))
    .orderBy(desc(communityPosts.postedAt))
    .limit(limit);
}

/** Posts a given user has liked — shows the post's actual author, not the liker. */
export async function getLikedPostsByUserId(userId: string, limit = 20) {
  return db
    .select(postWithAuthor)
    .from(likes)
    .innerJoin(communityPosts, eq(likes.postId, communityPosts.id))
    .innerJoin(user, eq(communityPosts.userId, user.id))
    .where(eq(likes.userId, userId))
    .orderBy(desc(likes.createdAt))
    .limit(limit);
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
