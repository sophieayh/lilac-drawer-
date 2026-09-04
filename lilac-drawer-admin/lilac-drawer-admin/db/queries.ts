import "server-only";
import { sql, desc, eq, asc, gte } from "drizzle-orm";
import { db } from "./index";
import { user, posts, products, communityPosts, pageViews, siteCategories } from "./schema";

// ---------- formatting helpers ----------
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2).replace(/\.00$/, "")}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ---------- dashboard stats ----------
export async function getDashboardStats() {
  const [[userRow], [postRow], [publishedPostRow], [productRow], [communityRow], [viewRow]] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(user),
    db.select({ count: sql<number>`count(*)::int` }).from(posts),
    db.select({ count: sql<number>`count(*)::int` }).from(posts).where(eq(posts.isPublished, true)),
    db.select({ count: sql<number>`count(*)::int` }).from(products),
    db.select({ count: sql<number>`count(*)::int` }).from(communityPosts),
    db.select({ count: sql<number>`count(*)::int` }).from(pageViews),
  ]);

  return {
    userCount: userRow?.count ?? 0,
    postCount: postRow?.count ?? 0,
    publishedPostCount: publishedPostRow?.count ?? 0,
    productCount: productRow?.count ?? 0,
    communityPostCount: communityRow?.count ?? 0,
    totalVisits: viewRow?.count ?? 0,
  };
}

/** Page views per day for the last N days (oldest first), for a simple traffic chart. */
export async function getVisitsByDay(days = 14) {
  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const rows = await db
    .select({
      day: sql<string>`to_char(${pageViews.createdAt}, 'YYYY-MM-DD')`,
      count: sql<number>`count(*)::int`,
    })
    .from(pageViews)
    .where(gte(pageViews.createdAt, since))
    .groupBy(sql`1`)
    .orderBy(sql`1`);

  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const result: { day: string; count: number }[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    result.push({ day: key, count: byDay.get(key) ?? 0 });
  }
  return result;
}

export async function getVisitsToday() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pageViews)
    .where(gte(pageViews.createdAt, startOfDay));
  return row?.count ?? 0;
}

// ---------- users ----------
export async function getAllUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      handle: user.handle,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));
}

export async function getUserById(id: string) {
  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------- products ----------
export async function getAllProducts() {
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const rows = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------- posts (includes drafts) ----------
export async function getAllPosts() {
  return db.select().from(posts).orderBy(asc(posts.sortOrder), desc(posts.publishedAt));
}

export async function getPostById(id: number) {
  const rows = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  return rows[0] ?? null;
}

// ---------- site categories & subcategories ----------
export async function getAllCategories(section?: string) {
  if (section && section !== "all") {
    return db
      .select()
      .from(siteCategories)
      .where(eq(siteCategories.section, section))
      .orderBy(asc(siteCategories.sortOrder), asc(siteCategories.id));
  }
  return db
    .select()
    .from(siteCategories)
    .orderBy(asc(siteCategories.sortOrder), asc(siteCategories.id));
}

export async function getCategoryById(id: number) {
  const rows = await db.select().from(siteCategories).where(eq(siteCategories.id, id)).limit(1);
  return rows[0] ?? null;
}
