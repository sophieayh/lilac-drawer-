import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ArticleCarousel from "@/components/ArticleCarousel";
import SmartProductCard from "@/components/SmartProductCard";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import {
  getCategoryBySlug,
  getAllCategorySlugs,
  getCategoryArticles,
  getCategoryProducts,
  getProductToArticleMap,
  findRelatedArticleForProduct,
} from "@/db/queries";
import type { SubCategoryItem } from "@/db/schema";

export const revalidate = 60;

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sub?: string }>;
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { sub } = await searchParams;

  const category = await getCategoryBySlug(slug);
  const categoryName = category?.label || slug.replace(/-/g, " ");

  const subItem =
    category && Array.isArray(category.subcategories) && sub
      ? (category.subcategories as SubCategoryItem[]).find(
          (s) => slugify(s.label) === sub.toLowerCase() || s.id === sub
        )
      : null;

  const title = subItem
    ? `${subItem.label} — ${categoryName} Reviews & Deals | ${siteConfig.name}`
    : `${categoryName} — Tested Reviews, Buying Guides & Deals | ${siteConfig.name}`;

  const description =
    subItem?.description ||
    `Explore tested ${categoryName.toLowerCase()} reviews, top-rated products, price comparisons and editor recommendations.`;

  return buildMetadata({
    title,
    description,
    path: `/category/${slug}${sub ? `?sub=${sub}` : ""}`,
  });
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { sub } = await searchParams;

  const category = await getCategoryBySlug(slug);

  // If category wasn't found in DB, derive title from slug
  const categoryLabel = category?.label || slug.replace(/-/g, " ");
  const subcategories: SubCategoryItem[] =
    category && Array.isArray(category.subcategories) ? category.subcategories : [];

  // Find active subcategory if sub query param is present
  const activeSubItem = sub
    ? subcategories.find((s) => slugify(s.label) === sub.toLowerCase() || s.id === sub)
    : null;

  // Collect terms for filtering
  const filterTerms = activeSubItem
    ? [activeSubItem.label, categoryLabel]
    : [categoryLabel, ...subcategories.map((s) => s.label)];

  // Fetch articles, products, and article product mapping concurrently
  const [articles, products, productArticleMap] = await Promise.all([
    getCategoryArticles(filterTerms),
    getCategoryProducts(filterTerms),
    getProductToArticleMap(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: `${categoryLabel} Reviews & Products`,
          description: `Tested reviews and curated buying recommendations for ${categoryLabel}.`,
          url: absoluteUrl(`/category/${slug}`),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Categories", item: absoluteUrl("/explore") },
            { "@type": "ListItem", position: 3, name: categoryLabel, item: absoluteUrl(`/category/${slug}`) },
            ...(activeSubItem
              ? [{ "@type": "ListItem", position: 4, name: activeSubItem.label, item: absoluteUrl(`/category/${slug}?sub=${sub}`) }]
              : []),
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-8 px-6 md:px-12">
        <div className="max-w-[1400px] mx-auto flex flex-col gap-10">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-tan-dark">
            <Link href="/" className="hover:text-purple-deep transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/explore" className="hover:text-purple-deep transition-colors">
              Categories
            </Link>
            <span>/</span>
            <Link
              href={`/category/${slug}`}
              className={activeSubItem ? "hover:text-purple-deep transition-colors" : "font-semibold text-purple-deep"}
            >
              {categoryLabel}
            </Link>
            {activeSubItem && (
              <>
                <span>/</span>
                <span className="font-semibold text-purple-deep">{activeSubItem.label}</span>
              </>
            )}
          </nav>

          {/* Category Hero Header */}
          <div className="border-b border-border pb-6 flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-rose">
                Category Guide
              </span>
              <h1 className="font-heading text-3xl md:text-4xl text-purple-deep tracking-tight">
                {activeSubItem ? activeSubItem.label : categoryLabel}
              </h1>
              <p className="text-sm md:text-base text-tan-dark max-w-2xl mt-1 leading-relaxed">
                {activeSubItem?.description ||
                  `Independent reviews, hands-on lab testing, and best buying recommendations for ${categoryLabel.toLowerCase()}.`}
              </p>
            </div>

            {/* Subcategory Filter Pills */}
            {subcategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 no-scrollbar">
                <Link
                  href={`/category/${slug}`}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    !sub
                      ? "bg-purple-deep text-white shadow-sm"
                      : "bg-white border border-border text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  All {categoryLabel}
                </Link>

                {subcategories.map((item) => {
                  const itemSlug = slugify(item.label);
                  const isCurrent = sub === itemSlug || sub === item.id;
                  return (
                    <Link
                      key={item.id || item.label}
                      href={`/category/${slug}?sub=${itemSlug}`}
                      className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        isCurrent
                          ? "bg-purple-deep text-white shadow-sm"
                          : "bg-white border border-border text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Section: Articles Carousel */}
          {articles.length > 0 && (
            <div className="bg-mauve-50/40 border border-border/80 rounded-3xl p-6 md:p-8">
              <ArticleCarousel
                articles={articles}
                categoryTitle={activeSubItem ? activeSubItem.label : categoryLabel}
              />
            </div>
          )}

          {/* Bottom Section: Category Products Grid */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-4 flex-wrap">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose">
                  Tested Picks
                </span>
                <h2 className="font-heading text-2xl text-purple-deep mt-0.5">
                  Recommended {activeSubItem ? activeSubItem.label : categoryLabel} Products
                </h2>
              </div>
              <span className="text-xs font-semibold text-tan-dark bg-white border border-border px-3 py-1 rounded-full">
                {products.length} {products.length === 1 ? "product found" : "products found"}
              </span>
            </div>

            {products.length === 0 ? (
              <div className="py-16 text-center border-2 border-dashed border-border rounded-2xl bg-white p-8">
                <p className="font-heading text-lg text-purple-deep">No products found in this category yet.</p>
                <p className="text-xs text-tan-dark mt-1">Check back soon as our editors update reviews weekly.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((p) => {
                  const matchedArticle = findRelatedArticleForProduct(p.name, productArticleMap);

                  return (
                    <SmartProductCard
                      key={p.id}
                      product={p}
                      relatedArticle={matchedArticle}
                    />
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}
