import { requireAdmin } from "@/lib/admin";
import { db } from "@/db";
import { posts, products } from "@/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import PlacementsContainer from "./PlacementsContainer";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Site Placements & Layout | Admin",
};

export default async function PlacementsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
  await requireAdmin();

  const [allPosts, allProducts] = await Promise.all([
    db
      .select()
      .from(posts)
      .where(eq(posts.isPublished, true))
      .orderBy(asc(posts.sortOrder), desc(posts.publishedAt)),
    db
      .select()
      .from(products)
      .orderBy(desc(products.createdAt), desc(products.id)),
  ]);

  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialTab = resolvedParams?.tab === "products" ? "products" : "articles";

  return (
    <PlacementsContainer
      initialPosts={allPosts}
      initialProducts={allProducts}
      defaultTab={initialTab}
    />
  );
}
