"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slugify";
import { db } from "@/db";
import { products, posts, user } from "@/db/schema";

// ---------------------------------------------------------------------------
// Products / affiliate links
// ---------------------------------------------------------------------------

function toIntOrNull(v: FormDataEntryValue | null): number | null {
  if (v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
}

function productValuesFromForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const priceDollars = Number(formData.get("price") ?? 0);
  const compareAtDollars = formData.get("compareAtPrice");
  const rawSlug = String(formData.get("slug") ?? "").trim();

  return {
    slug: slugify(rawSlug || name),
    name,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || "Uncategorized",
    imageLabel: String(formData.get("imageLabel") ?? "").trim() || name,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    priceCents: Math.round(priceDollars * 100),
    compareAtPriceCents:
      compareAtDollars && String(compareAtDollars).trim() !== "" ? Math.round(Number(compareAtDollars) * 100) : null,
    affiliateUrl: String(formData.get("affiliateUrl") ?? "").trim() || null,
    rank: toIntOrNull(formData.get("rank")),
    rankNote: String(formData.get("rankNote") ?? "").trim() || null,
    badge: String(formData.get("badge") ?? "").trim() || null,
    discountPercent: toIntOrNull(formData.get("discountPercent")),
    inStock: formData.get("inStock") === "on",
    isFeaturedHome: formData.get("isFeaturedHome") === "on",
    isTopPick: formData.get("isTopPick") === "on",
    isFeaturedDeals: formData.get("isFeaturedDeals") === "on",
    isSaleOff: formData.get("isSaleOff") === "on",
    isTodayDeal: formData.get("isTodayDeal") === "on",
    isNewArrival: formData.get("isNewArrival") === "on",
    isBestSeller: formData.get("isBestSeller") === "on",
    isExploreDeal: formData.get("isExploreDeal") === "on",
    isRecommended: formData.get("isRecommended") === "on",
    isSaved: formData.get("isSaved") === "on",
    isSuggested: formData.get("isSuggested") === "on",
  };
}

export async function createProduct(formData: FormData) {
  await requireAdmin();
  const values = productValuesFromForm(formData);
  if (!values.name) throw new Error("Product name is required.");
  if (!values.slug) throw new Error("Couldn't derive a slug — set one manually.");

  await db.insert(products).values(values);
  revalidatePath("/products");
  redirect("/products");
}

export async function updateProduct(id: number, formData: FormData) {
  await requireAdmin();
  const values = productValuesFromForm(formData);
  if (!values.name) throw new Error("Product name is required.");
  if (!values.slug) throw new Error("Couldn't derive a slug — set one manually.");

  await db.update(products).set({ ...values, updatedAt: new Date() }).where(eq(products.id, id));
  revalidatePath("/products");
  redirect("/products");
}

export async function deleteProduct(id: number) {
  await requireAdmin();
  await db.delete(products).where(eq(products.id, id));
  revalidatePath("/products");
}

// ---------------------------------------------------------------------------
// Articles (posts)
// ---------------------------------------------------------------------------

const POST_CATEGORIES = ["REVIEWS", "CARE", "GUIDES", "STORIES"] as const;

function postValuesFromForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const category = String(formData.get("category") ?? "REVIEWS").trim().toUpperCase();

  return {
    slug: slugify(rawSlug || title),
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim() || null,
    category: (POST_CATEGORIES as readonly string[]).includes(category) ? category : "REVIEWS",
    topicLabel: String(formData.get("topicLabel") ?? "").trim() || null,
    imageLabel: String(formData.get("imageLabel") ?? "").trim() || title,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    author: String(formData.get("author") ?? "").trim() || "the Lilac Drawer editors",
    isPublished: formData.get("isPublished") === "on",
    isNewHome: formData.get("isNewHome") === "on",
    isHomePreview: formData.get("isHomePreview") === "on",
    isHomeReview: formData.get("isHomeReview") === "on",
    isRecentBlog: formData.get("isRecentBlog") === "on",
    isSideStory: formData.get("isSideStory") === "on",
    isDealsPreview: formData.get("isDealsPreview") === "on",
  };
}

export async function createArticle(formData: FormData) {
  await requireAdmin();
  const values = postValuesFromForm(formData);
  if (!values.title) throw new Error("Title is required.");
  if (!values.excerpt) throw new Error("Excerpt is required.");
  if (!values.slug) throw new Error("Couldn't derive a slug — set one manually.");

  await db.insert(posts).values(values);
  revalidatePath("/articles");
  redirect("/articles");
}

export async function updateArticle(id: number, formData: FormData) {
  await requireAdmin();
  const values = postValuesFromForm(formData);
  if (!values.title) throw new Error("Title is required.");
  if (!values.excerpt) throw new Error("Excerpt is required.");
  if (!values.slug) throw new Error("Couldn't derive a slug — set one manually.");

  await db.update(posts).set(values).where(eq(posts.id, id));
  revalidatePath("/articles");
  redirect("/articles");
}

export async function deleteArticle(id: number) {
  await requireAdmin();
  await db.delete(posts).where(eq(posts.id, id));
  revalidatePath("/articles");
}

export async function togglePublish(id: number, nextValue: boolean) {
  await requireAdmin();
  await db.update(posts).set({ isPublished: nextValue }).where(eq(posts.id, id));
  revalidatePath("/articles");
}

/**
 * Moves an article up or down one place in display order by swapping its
 * sortOrder with its neighbor in the currently-ordered list.
 */
export async function moveArticle(id: number, direction: "up" | "down") {
  await requireAdmin();
  const ordered = await db.select({ id: posts.id, sortOrder: posts.sortOrder }).from(posts).orderBy(asc(posts.sortOrder), asc(posts.id));
  const index = ordered.findIndex((p) => p.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ordered.length) return;

  const a = ordered[index];
  const b = ordered[swapWith];
  await db.transaction(async (tx) => {
    await tx.update(posts).set({ sortOrder: b.sortOrder }).where(eq(posts.id, a.id));
    await tx.update(posts).set({ sortOrder: a.sortOrder }).where(eq(posts.id, b.id));
  });
  revalidatePath("/articles");
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function setUserRole(id: string, role: "admin" | "user") {
  const currentAdmin = await requireAdmin();
  if (currentAdmin.id === id && role !== "admin") {
    throw new Error("You can't remove your own admin access.");
  }
  await db.update(user).set({ role }).where(eq(user.id, id));
  revalidatePath("/users");
}
