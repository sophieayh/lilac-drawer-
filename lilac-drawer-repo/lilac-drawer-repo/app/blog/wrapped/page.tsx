import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import {
  getYearlyWrapSettings,
  getTopPicks,
  getRecentBlogPosts,
} from "@/db/queries";

export const revalidate = 60;

function getCategoryHref(cat: string): string {
  const clean = cat.trim().toLowerCase();
  if (clean === "accessories" || clean === "bags") return "/category/bags-accessories";
  if (clean === "clothing care" || clean === "care") return "/category/clothing-care";
  if (clean === "wardrobe storage" || clean === "wardrobe") return "/category/wardrobe-storage";
  if (clean === "jewelry & watches" || clean === "jewelry") return "/category/jewelry-watches";
  if (clean === "beauty & makeup" || clean === "makeup" || clean === "beauty") return "/category/beauty-makeup";
  return `/category/${slugify(cat)}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const yearlyWrap = await getYearlyWrapSettings();
  const title = `${yearlyWrap?.title || "The Yearly Wrap"} — ${yearlyWrap?.subtitle || "2026 Shopping Wrapped"}`;
  const description =
    "Explore our annual editorial recap: top tested products, most-read care guides, reader favorites, and best recommendations of the year on Lilac Drawer.";

  return buildMetadata({
    title,
    description,
    path: "/blog/wrapped",
  });
}

export default async function BlogWrappedPage() {
  const [yearlyWrap, topPicks, recentPosts] = await Promise.all([
    getYearlyWrapSettings(),
    getTopPicks(),
    getRecentBlogPosts(),
  ]);

  const topPickProduct = topPicks[0] || null;

  const yearlyCategories = (
    yearlyWrap?.topCategories ??
    "CLOTHING CARE\nACCESSORIES\nWARDROBE STORAGE\nJEWELRY & WATCHES\nBAGS"
  )
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const mostReviewedHref =
    yearlyWrap?.mostReviewedLinkUrl ||
    (topPickProduct?.slug ? `/deals/${topPickProduct.slug}` : "/deals");

  const topPickHref =
    yearlyWrap?.topPickLinkUrl ||
    (topPickProduct?.slug ? `/deals/${topPickProduct.slug}` : "/deals");

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: `${yearlyWrap?.title || "The Yearly Wrap"} — ${yearlyWrap?.subtitle || "2026 Shopping Wrapped"}`,
          description: "Our comprehensive annual report of the top reviewed and tested products.",
          url: absoluteUrl("/blog/wrapped"),
          publisher: { "@type": "Organization", name: siteConfig.name },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Blog", item: absoluteUrl("/blog") },
            { "@type": "ListItem", position: 3, name: "Shopping Wrapped", item: absoluteUrl("/blog/wrapped") },
          ],
        }}
      />
      <SiteHeader />

      <main className="bg-[#fbf6f0] text-purple-deep min-h-screen font-sans py-8 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto space-y-10">
          {/* Breadcrumb Navigation & Back Link */}
          <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-tan font-medium">
            <div className="flex items-center gap-2">
              <Link href="/" className="hover:text-rose transition-colors">
                Home
              </Link>
              <span>/</span>
              <Link href="/blog" className="hover:text-rose transition-colors">
                Blog
              </Link>
              <span>/</span>
              <span className="text-purple-deep font-bold">Shopping Wrapped</span>
            </div>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-xs font-bold text-rose hover:underline"
            >
              ← Back to all articles
            </Link>
          </nav>

          {/* Dedicated Annual Wrapped Editorial Poster */}
          <section className="border-2 border-purple-deep p-8 md:p-14 bg-[#fffdfb] shadow-sm rounded-2xl">
            <h1 className="font-heading text-4xl md:text-[64px] font-black text-center text-purple-deep tracking-tight">
              {yearlyWrap?.title || "The Yearly Wrap"}
            </h1>
            <div className="text-center text-[13px] tracking-[0.2em] uppercase text-rose font-bold my-1.5 mb-6">
              {yearlyWrap?.subtitle || "2026 Shopping Wrapped"}
            </div>
            <div className="border-t-2 border-b border-purple-deep h-[3px] mb-6" />

            {/* Top 3 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] border-t border-b border-purple-deep">
              {/* 1. Reviewer Age */}
              <div className="p-7 md:border-r border-purple-deep text-center flex flex-col justify-center">
                <div className="text-[11px] tracking-wider uppercase font-bold underline mb-2.5">
                  {yearlyWrap?.reviewerAgeLabel || "My Reviewer Age"}
                </div>
                <div className="font-heading text-[76px] font-black text-purple-deep leading-none">
                  {yearlyWrap?.reviewerAge || "3"}
                </div>
                <p className="text-xs leading-relaxed text-tan-dark mt-2.5">
                  {yearlyWrap?.reviewerAgeText || "Three years testing products so readers don't have to guess."}
                </p>
              </div>

              {/* 2. Most Reviewed Product */}
              <div className="p-7 md:border-r border-purple-deep text-center">
                <Link href={mostReviewedHref} className="group block text-purple-deep">
                  <div className="text-sm font-semibold text-purple-deep mb-3 group-hover:text-rose transition-colors">
                    {yearlyWrap?.mostReviewedTitle || "Most Reviewed Product"}
                  </div>
                  <ImageSlot
                    label={
                      yearlyWrap?.mostReviewedImageLabel ||
                      "Garment steamer — most reviewed product"
                    }
                    imageUrl={
                      yearlyWrap?.mostReviewedImageUrl || topPickProduct?.imageUrl || null
                    }
                    className="w-full h-[260px] rounded-lg group-hover:opacity-90 transition-opacity"
                    tone="mauve"
                  />
                  <p className="text-xs leading-relaxed text-tan-dark mt-2.5 group-hover:text-purple-deep transition-colors">
                    {yearlyWrap?.mostReviewedText ||
                      (topPickProduct
                        ? `${topPickProduct.name} topped reader clicks all year, reviewed and updated four times.`
                        : "The garment steamer topped reader clicks all year, reviewed and updated four times.")}
                  </p>
                </Link>
              </div>

              {/* 3. Listening Report */}
              <div className="p-7 text-center flex flex-col justify-center">
                <div className="text-[11px] tracking-wider uppercase font-bold underline mb-2.5">
                  {yearlyWrap?.listeningReportLabel || "Listening Report"}
                </div>
                <p className="text-xs leading-relaxed text-tan-dark mb-3">
                  {yearlyWrap?.listeningReportText ||
                    "Readers spent the most time this year on care guides, followed by top-10 lists and jewelry storage."}
                </p>
                <div className="font-heading text-sm font-bold text-purple-deep">
                  {yearlyWrap?.listeningReportDate || "Aug 2, 2026"}
                </div>
              </div>
            </div>

            {/* Bottom 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b border-purple-deep">
              {/* 4. Top Pick */}
              <div className="p-7 md:border-r border-purple-deep flex gap-5 items-center">
                <Link
                  href={topPickHref}
                  className="w-[70px] h-[70px] rounded-full bg-purple-deep shrink-0 overflow-hidden flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity"
                >
                  {yearlyWrap?.topPickImageUrl || topPickProduct?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={yearlyWrap?.topPickImageUrl || topPickProduct?.imageUrl || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold uppercase">Top</span>
                  )}
                </Link>
                <div>
                  <div className="text-[11px] tracking-wider uppercase font-bold mb-1">
                    {yearlyWrap?.topPickLabel || "Top Pick 2026"}
                  </div>
                  <Link
                    href={topPickHref}
                    className="font-heading text-[15px] font-bold text-purple-deep hover:text-rose transition-colors block"
                  >
                    {yearlyWrap?.topPickTitle || topPickProduct?.name || "Steamfast SF-717"}
                  </Link>
                  <div className="text-[11.5px] text-tan mt-0.5">
                    {yearlyWrap?.topPickClicks || "4,120 clicks"}
                  </div>
                </div>
              </div>

              {/* 5. Top Categories */}
              <div className="p-7">
                <div className="text-[11px] tracking-wider uppercase font-bold underline mb-2.5">
                  {yearlyWrap?.topCategoriesLabel || "Top Categories This Year"}
                </div>
                <div className="font-heading text-[15px] font-bold text-purple-deep leading-relaxed tracking-wide flex flex-col gap-1">
                  {yearlyCategories.map((cat, idx) => (
                    <Link
                      key={idx}
                      href={getCategoryHref(cat)}
                      className="hover:text-rose transition-colors block py-0.5 underline-offset-4 hover:underline"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Curated Recommendations & Tested Stories */}
          <section className="pt-4">
            <div className="flex items-center justify-between pb-3 mb-6 border-b border-border">
              <h2 className="font-heading text-xl font-bold text-purple-deep">
                Featured Guides & Tested Stories
              </h2>
              <Link href="/blog/all" className="text-xs font-bold text-rose hover:underline">
                View All Articles →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentPosts.slice(0, 3).map((post) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="bg-white rounded-2xl p-4 border border-border/80 card-hover group flex flex-col justify-between"
                >
                  <div>
                    <ImageSlot
                      label={post.imageLabel || "Article cover"}
                      imageUrl={post.imageUrl}
                      className="w-full h-44 rounded-xl mb-3 shadow-2xs"
                      tone="mauve"
                    />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose">
                      {post.category || "Editorial"}
                    </span>
                    <h3 className="font-heading text-[15px] font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-2 mt-1 leading-snug">
                      {post.title}
                    </h3>
                  </div>
                  <p className="text-xs text-tan-dark line-clamp-2 mt-2 leading-relaxed">
                    {post.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      <SiteFooter />
    </>
  );
}