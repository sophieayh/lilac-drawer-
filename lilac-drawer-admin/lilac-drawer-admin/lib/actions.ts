"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin";
import { slugify } from "@/lib/slugify";
import { db } from "@/db";
import { products, posts, user, siteCategories, banners, yearlyWrap } from "@/db/schema";

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
  const slug = slugify(rawSlug || name) || `product-${Date.now().toString(36)}`;

  let stores = null;
  const rawStores = formData.get("stores");
  if (rawStores && typeof rawStores === "string" && rawStores.trim() !== "") {
    try {
      stores = JSON.parse(rawStores);
    } catch (e) {
      console.error("Failed to parse product stores", e);
    }
  }

  let affiliateUrl = String(formData.get("affiliateUrl") ?? "").trim() || null;
  if (!affiliateUrl && Array.isArray(stores) && stores.length > 0 && stores[0].url) {
    affiliateUrl = stores[0].url;
  }

  return {
    slug,
    name,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    category: String(formData.get("category") ?? "").trim() || "Uncategorized",
    imageLabel: String(formData.get("imageLabel") ?? "").trim() || name,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    priceCents: Math.round(priceDollars * 100),
    compareAtPriceCents:
      compareAtDollars && String(compareAtDollars).trim() !== "" ? Math.round(Number(compareAtDollars) * 100) : null,
    affiliateUrl,
    stores,
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

function postValuesFromForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const rawCategory = String(formData.get("category") ?? "").trim();
  const category = rawCategory || "REVIEWS";
  const slug = slugify(rawSlug || title) || `article-${Date.now().toString(36)}`;

  let structuredContent = null;
  const rawStructured = formData.get("structuredContent");
  if (rawStructured && typeof rawStructured === "string" && rawStructured.trim() !== "") {
    try {
      structuredContent = JSON.parse(rawStructured);
    } catch (e) {
      console.error("Failed to parse structuredContent", e);
    }
  }

  const topicLabel = String(formData.get("topicLabel") ?? "").trim() || category;

  return {
    slug,
    title,
    excerpt: String(formData.get("excerpt") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim() || null,
    structuredContent,
    category,
    topicLabel: topicLabel || null,
    imageLabel: String(formData.get("imageLabel") ?? "").trim() || title,
    imageUrl: String(formData.get("imageUrl") ?? "").trim() || null,
    author: String(formData.get("author") ?? "").trim() || "the Lilac Drawer editors",
    isPublished: formData.get("isPublished") === "on",
    isHomeSpread: formData.get("isHomeSpread") === "on",
    isNewHome: formData.get("isNewHome") === "on",
    isHomePreview: formData.get("isHomePreview") === "on",
    isHomeReview: formData.get("isHomeReview") === "on",
    isHomeGuide: formData.get("isHomeGuide") === "on",
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
  await db.update(posts).set({ sortOrder: b.sortOrder }).where(eq(posts.id, a.id));
  await db.update(posts).set({ sortOrder: a.sortOrder }).where(eq(posts.id, b.id));
  revalidatePath("/articles");
}

const VALID_PLACEMENT_KEYS = new Set([
  "isHomeSpread",
  "isNewHome",
  "isHomePreview",
  "isHomeReview",
  "isHomeGuide",
  "isRecentBlog",
  "isSideStory",
  "isDealsPreview",
]);

export async function updatePostPlacement(id: number, key: string, value: boolean) {
  await requireAdmin();
  if (!VALID_PLACEMENT_KEYS.has(key)) {
    throw new Error(`Invalid placement key: ${key}`);
  }
  await db.update(posts).set({ [key]: value }).where(eq(posts.id, id));
  revalidatePath("/placements");
  revalidatePath("/articles");
}

const VALID_PRODUCT_PLACEMENT_KEYS = new Set([
  "isFeaturedHome",
  "isTopPick",
  "isFeaturedDeals",
  "isSaleOff",
  "isTodayDeal",
  "isNewArrival",
  "isBestSeller",
  "isExploreDeal",
  "isRecommended",
  "isSaved",
  "isSuggested",
]);

export async function updateProductPlacement(id: number, key: string, value: boolean) {
  await requireAdmin();
  if (!VALID_PRODUCT_PLACEMENT_KEYS.has(key)) {
    throw new Error(`Invalid product placement key: ${key}`);
  }
  await db.update(products).set({ [key]: value }).where(eq(products.id, id));
  revalidatePath("/placements");
  revalidatePath("/products");
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

// ---------------------------------------------------------------------------
// Site Categories & Subcategories (Menus)
// ---------------------------------------------------------------------------

function categoryValuesFromForm(formData: FormData) {
  const label = String(formData.get("label") ?? "").trim();
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const slug = slugify(rawSlug || label) || `cat-${Date.now().toString(36)}`;
  const icon = String(formData.get("icon") ?? "").trim() || null;
  const colorHex = String(formData.get("colorHex") ?? "").trim() || null;
  const href = `/category/${slug}`;
  const section = String(formData.get("section") ?? "header").trim() || "header";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";

  let subcategories = null;
  const rawSubcategories = formData.get("subcategories");
  if (rawSubcategories && typeof rawSubcategories === "string" && rawSubcategories.trim() !== "") {
    try {
      const parsed = JSON.parse(rawSubcategories);
      if (Array.isArray(parsed)) {
        subcategories = parsed.map((item: any) => ({
          id: item.id || `sub-${slugify(item.label || "item")}`,
          label: item.label,
          href: `/category/${slug}?sub=${slugify(item.label || "")}`,
          description: item.description || "",
        }));
      }
    } catch (e) {
      console.error("Failed to parse subcategories", e);
    }
  }

  return {
    label,
    slug,
    icon,
    colorHex,
    href,
    section,
    subcategories,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    isActive,
  };
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const values = categoryValuesFromForm(formData);
  if (!values.label) throw new Error("Category label is required.");

  await db.insert(siteCategories).values(values);
  revalidatePath("/categories");
  redirect("/categories");
}

export async function updateCategory(id: number, formData: FormData) {
  await requireAdmin();
  const values = categoryValuesFromForm(formData);
  if (!values.label) throw new Error("Category label is required.");

  await db.update(siteCategories).set(values).where(eq(siteCategories.id, id));
  revalidatePath("/categories");
  redirect("/categories");
}

export async function deleteCategory(id: number) {
  await requireAdmin();
  await db.delete(siteCategories).where(eq(siteCategories.id, id));
  revalidatePath("/categories");
}

export async function toggleCategoryActive(id: number, nextValue: boolean) {
  await requireAdmin();
  await db.update(siteCategories).set({ isActive: nextValue }).where(eq(siteCategories.id, id));
  revalidatePath("/categories");
}

export async function moveCategory(id: number, direction: "up" | "down") {
  await requireAdmin();
  const target = await db.select().from(siteCategories).where(eq(siteCategories.id, id)).limit(1);
  if (!target[0]) return;

  const section = target[0].section;
  const ordered = await db
    .select({ id: siteCategories.id, sortOrder: siteCategories.sortOrder })
    .from(siteCategories)
    .where(eq(siteCategories.section, section))
    .orderBy(asc(siteCategories.sortOrder), asc(siteCategories.id));

  const index = ordered.findIndex((c) => c.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ordered.length) return;

  const a = ordered[index];
  const b = ordered[swapWith];
  await db.update(siteCategories).set({ sortOrder: b.sortOrder }).where(eq(siteCategories.id, a.id));
  await db.update(siteCategories).set({ sortOrder: a.sortOrder }).where(eq(siteCategories.id, b.id));
  revalidatePath("/categories");
}

// ---------------------------------------------------------------------------
// Advertising Banners & Sponsored Placements
// ---------------------------------------------------------------------------

function bannerValuesFromForm(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();
  const subtitle = String(formData.get("subtitle") ?? "").trim() || null;
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();
  const imageLabel = String(formData.get("imageLabel") ?? "").trim() || title || "Advertisement";
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const placement = String(formData.get("placement") ?? "community_banner").trim() || "community_banner";
  const badgeText = String(formData.get("badgeText") ?? "").trim() || "Sponsored";
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const isActive = formData.get("isActive") === "on";

  return {
    title,
    subtitle,
    imageUrl,
    imageLabel,
    linkUrl,
    placement,
    badgeText,
    sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
    isActive,
  };
}

export async function createBanner(formData: FormData) {
  await requireAdmin();
  const values = bannerValuesFromForm(formData);
  if (!values.title) throw new Error("Banner title is required.");
  if (!values.imageUrl) throw new Error("Banner image URL or file upload is required.");
  if (!values.linkUrl) throw new Error("Destination link URL is required.");

  await db.insert(banners).values(values);
  revalidatePath("/banners");
  redirect("/banners");
}

export async function updateBanner(id: number, formData: FormData) {
  await requireAdmin();
  const values = bannerValuesFromForm(formData);
  if (!values.title) throw new Error("Banner title is required.");
  if (!values.imageUrl) throw new Error("Banner image URL or file upload is required.");
  if (!values.linkUrl) throw new Error("Destination link URL is required.");

  await db.update(banners).set({ ...values, updatedAt: new Date() }).where(eq(banners.id, id));
  revalidatePath("/banners");
  redirect("/banners");
}

export async function deleteBanner(id: number) {
  await requireAdmin();
  await db.delete(banners).where(eq(banners.id, id));
  revalidatePath("/banners");
}

export async function toggleBannerActive(id: number, nextValue: boolean) {
  await requireAdmin();
  await db.update(banners).set({ isActive: nextValue, updatedAt: new Date() }).where(eq(banners.id, id));
  revalidatePath("/banners");
}

export async function moveBanner(id: number, direction: "up" | "down") {
  await requireAdmin();
  const target = await db.select().from(banners).where(eq(banners.id, id)).limit(1);
  if (!target[0]) return;

  const placement = target[0].placement;
  const ordered = await db
    .select({ id: banners.id, sortOrder: banners.sortOrder })
    .from(banners)
    .where(eq(banners.placement, placement))
    .orderBy(asc(banners.sortOrder), asc(banners.id));

  const index = ordered.findIndex((b) => b.id === id);
  if (index === -1) return;
  const swapWith = direction === "up" ? index - 1 : index + 1;
  if (swapWith < 0 || swapWith >= ordered.length) return;

  const a = ordered[index];
  const b = ordered[swapWith];
  await db.update(banners).set({ sortOrder: b.sortOrder }).where(eq(banners.id, a.id));
  await db.update(banners).set({ sortOrder: a.sortOrder }).where(eq(banners.id, b.id));
  revalidatePath("/banners");
}

// ---------------------------------------------------------------------------
// Yearly Wrap (The Yearly Wrap section on the blog page)
// ---------------------------------------------------------------------------

export async function getYearlyWrap() {
  const rows = await db.select().from(yearlyWrap).limit(1);
  return rows[0] ?? null;
}

export async function updateYearlyWrap(formData: FormData) {
  await requireAdmin();

  const title = String(formData.get("title") ?? "The Yearly Wrap").trim();
  const subtitle = String(formData.get("subtitle") ?? "2026 Shopping Wrapped").trim();
  const isActive = formData.get("isActive") === "true" || formData.get("isActive") === "on";

  // 1. Reviewer Age
  const reviewerAge = String(formData.get("reviewerAge") ?? "3").trim();
  const reviewerAgeLabel = String(formData.get("reviewerAgeLabel") ?? "MY REVIEWER AGE").trim();
  const reviewerAgeText = String(formData.get("reviewerAgeText") ?? "").trim();

  // 2. Most Reviewed Product
  const mostReviewedTitle = String(formData.get("mostReviewedTitle") ?? "Most Reviewed Product").trim();
  const mostReviewedImageUrl = String(formData.get("mostReviewedImageUrl") ?? "").trim() || null;
  const mostReviewedImageLabel = String(formData.get("mostReviewedImageLabel") ?? "").trim() || null;
  const mostReviewedText = String(formData.get("mostReviewedText") ?? "").trim();
  const mostReviewedLinkUrl = String(formData.get("mostReviewedLinkUrl") ?? "").trim() || null;

  // 3. Listening Report
  const listeningReportLabel = String(formData.get("listeningReportLabel") ?? "LISTENING REPORT").trim();
  const listeningReportText = String(formData.get("listeningReportText") ?? "").trim();
  const listeningReportDate = String(formData.get("listeningReportDate") ?? "").trim();

  // 4. Top Pick
  const topPickLabel = String(formData.get("topPickLabel") ?? "TOP PICK 2026").trim();
  const topPickTitle = String(formData.get("topPickTitle") ?? "").trim();
  const topPickClicks = String(formData.get("topPickClicks") ?? "").trim();
  const topPickImageUrl = String(formData.get("topPickImageUrl") ?? "").trim() || null;
  const topPickLinkUrl = String(formData.get("topPickLinkUrl") ?? "").trim() || null;

  // 5. Top Categories
  const topCategoriesLabel = String(formData.get("topCategoriesLabel") ?? "TOP CATEGORIES THIS YEAR").trim();
  const topCategories = String(formData.get("topCategories") ?? "").trim();

  const data = {
    title,
    subtitle,
    isActive,
    reviewerAge,
    reviewerAgeLabel,
    reviewerAgeText,
    mostReviewedTitle,
    mostReviewedImageUrl,
    mostReviewedImageLabel,
    mostReviewedText,
    mostReviewedLinkUrl,
    listeningReportLabel,
    listeningReportText,
    listeningReportDate,
    topPickLabel,
    topPickTitle,
    topPickClicks,
    topPickImageUrl,
    topPickLinkUrl,
    topCategoriesLabel,
    topCategories,
    updatedAt: new Date(),
  };

  const existing = await db.select().from(yearlyWrap).limit(1);
  if (existing[0]) {
    await db.update(yearlyWrap).set(data).where(eq(yearlyWrap.id, existing[0].id));
  } else {
    await db.insert(yearlyWrap).values(data);
  }

  revalidatePath("/yearly-wrap");
  revalidatePath("/blog");
}


