import { getYearlyWrap } from "@/lib/actions";
import { db } from "@/db";
import { products, siteCategories } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import YearlyWrapForm from "./YearlyWrapForm";

export const metadata = { title: "Yearly Wrap Settings" };

export default async function YearlyWrapPage() {
  const wrap = await getYearlyWrap();
  const [catalogProducts, allCategories] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        imageUrl: products.imageUrl,
        affiliateUrl: products.affiliateUrl,
      })
      .from(products)
      .orderBy(asc(products.name)),
    db
      .select({
        id: siteCategories.id,
        label: siteCategories.label,
        slug: siteCategories.slug,
      })
      .from(siteCategories)
      .where(eq(siteCategories.isActive, true))
      .orderBy(asc(siteCategories.sortOrder), asc(siteCategories.label)),
  ]);

  return (
    <YearlyWrapForm
      initial={wrap}
      productsList={catalogProducts}
      categoriesList={allCategories}
    />
  );
}
