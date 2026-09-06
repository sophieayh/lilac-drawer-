import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import {
  getAllPublishedPosts,
  getRecentBlogPosts,
  getSideStories,
  getPostsByCategory,
  getFeaturedPost,
  getTopPicks,
  getHeaderCategories,
  getYearlyWrapSettings,
  formatDate,
} from "@/db/queries";

function getCategoryHref(cat: string): string {
  const clean = cat.trim().toLowerCase();
  if (clean === "accessories" || clean === "bags") return "/category/bags-accessories";
  if (clean === "clothing care" || clean === "care") return "/category/clothing-care";
  if (clean === "wardrobe storage" || clean === "wardrobe") return "/category/wardrobe-storage";
  if (clean === "jewelry & watches" || clean === "jewelry") return "/category/jewelry-watches";
  if (clean === "beauty & makeup" || clean === "makeup" || clean === "beauty") return "/category/beauty-makeup";
  return `/category/${slugify(cat)}`;
}

const title = "Blog — Reviews, Care Guides & Wardrobe Tips";
const description =
  "Fresh reviews, care routines, and buying guides for clothing care, wardrobe storage, and accessories — updated weekly by Lilac Drawer.";

// ISR: revalidate DB-backed content every 60s instead of only at build/deploy time.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({ title, description, path: "/blog" });

export default async function BlogPage() {
  const [
    allPosts,
    recentDbPosts,
    sideDbStories,
    blogReviews,
    careDbArticles,
    guideDbPosts,
    topPicks,
    headerCats,
    yearlyWrap,
  ] = await Promise.all([
    getAllPublishedPosts(50),
    getRecentBlogPosts(),
    getSideStories(),
    getPostsByCategory("REVIEWS", 4),
    getPostsByCategory("CARE", 4),
    getPostsByCategory("GUIDES", 1),
    getTopPicks(),
    getHeaderCategories(),
    getYearlyWrapSettings(),
  ]);

  // Dynamic distribution & fallbacks to ensure full coverage
  const spreadHero = allPosts.find((p) => p.isHomeSpread) || allPosts[0] || null;
  const editorialPosts = allPosts.slice(0, 5);

  const featuredPost =
    allPosts.find((p) => p.isHomeGuide || p.category?.toUpperCase() === "CARE") ||
    allPosts[0] ||
    null;

  const recentList = recentDbPosts.length >= 4 ? recentDbPosts : allPosts.slice(0, 4);
  const sideStories = sideDbStories.length >= 2 ? sideDbStories : allPosts.slice(4, 6);

  const reviews = blogReviews.length >= 4 ? blogReviews : allPosts.slice(0, 4);
  const care = careDbArticles.length >= 4 ? careDbArticles : allPosts.slice(0, 4);
  const guidePost = guideDbPosts[0] || allPosts[0] || null;

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
          "@type": "Blog",
          name: `${siteConfig.name} Blog`,
          url: absoluteUrl("/blog"),
          description,
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
          ],
        }}
      />
      <SiteHeader />

      <main className="bg-[#fbf6f0] text-purple-deep min-h-screen font-sans pt-6">
        {/* Annual Wrapped Feature */}
        {(!yearlyWrap || yearlyWrap.isActive) && (
          <section className="px-6 md:px-12 pt-4 pb-14 max-w-[1100px] mx-auto">
            <div className="border-2 border-purple-deep p-8 md:p-14 bg-[#fffdfb]">
              <h2 className="font-heading text-4xl md:text-[64px] font-black text-center text-purple-deep tracking-tight">
                {yearlyWrap?.title || "The Yearly Wrap"}
              </h2>
              <div className="text-center text-[13px] tracking-[0.2em] uppercase text-rose font-bold my-1.5 mb-6">
                {yearlyWrap?.subtitle || "2026 Shopping Wrapped"}
              </div>
              <div className="border-t-2 border-b border-purple-deep h-[3px] mb-6" />

              {/* Top 3 Columns */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_1.3fr_1fr] border-t border-b border-purple-deep">
                {/* 1. Reviewer Age */}
                <div className="p-7 md:border-r border-purple-deep text-center">
                  <div className="text-[11px] tracking-wider uppercase font-bold underline mb-2.5">
                    {yearlyWrap?.reviewerAgeLabel || "My Reviewer Age"}
                  </div>
                  <div className="font-heading text-[76px] font-black text-purple-deep leading-none">
                    {yearlyWrap?.reviewerAge || "3"}
                  </div>
                  <p className="text-xs leading-relaxed text-tan-dark mt-2.5">
                    {yearlyWrap?.reviewerAgeText || "Three years testing products so readers don&apos;t have to guess."}
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
                <div className="p-7 text-center">
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
            </div>
          </section>
        )}

        {/* Minimal Editorial Spread */}
        <section className="px-6 md:px-12 pt-2 pb-14 max-w-[1200px] mx-auto border-t border-[#f3e6d0]">
          <div className="flex justify-between items-center py-5 text-[11px] tracking-widest uppercase text-tan">
            <span className="flex items-center gap-1.5 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-deep inline-block" />
              Lilac Drawer Editorial
            </span>
            <span className="font-semibold">Featured Stories</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center mb-10">
            <div>
              <h2 className="font-heading text-3xl md:text-[34px] leading-tight mb-4 text-purple-deep">
                {spreadHero?.title || "8 Days of Wardrobe Care, Done Right for You"}
              </h2>
              <p className="text-[14.5px] leading-relaxed text-tan-dark max-w-[400px]">
                {spreadHero?.excerpt ||
                  "A short daily routine that keeps clothes, jewelry, and accessories in shape without adding chores to your week."}
              </p>
            </div>
            {spreadHero && (
              <Link href={`/blog/${spreadHero.slug}`} className="group block">
                <ImageSlot
                  label={spreadHero.imageLabel || "Editorial hero photo"}
                  imageUrl={spreadHero.imageUrl}
                  className="w-full h-[280px] rounded-xl"
                  tone="mauve"
                />
              </Link>
            )}
          </div>

          <div className="flex justify-between items-baseline mb-5">
            <span className="text-[11.5px] font-bold tracking-wider uppercase text-rose flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose inline-block" />
              Latest Posts
            </span>
            <Link
              href="#recent-posts"
              className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors"
            >
              View All
            </Link>
          </div>

          {/* Asymmetric 5-card grid: 1.2fr 1fr 1fr 1fr */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1fr] gap-6">
            {/* Card 1: Large */}
            {editorialPosts[0] && (
              <Link href={`/blog/${editorialPosts[0].slug}`} className="group block text-purple-deep">
                <ImageSlot
                  label={editorialPosts[0].imageLabel}
                  imageUrl={editorialPosts[0].imageUrl}
                  className="w-full h-[220px] rounded-lg"
                  tone="mauve"
                />
                <h3 className="font-heading text-base font-bold leading-snug my-3 group-hover:text-rose transition-colors">
                  {editorialPosts[0].title}
                </h3>
              </Link>
            )}

            {/* Column 2: Stacked 2 Cards */}
            <div className="flex flex-col gap-[18px]">
              {editorialPosts[1] && (
                <Link href={`/blog/${editorialPosts[1].slug}`} className="group block text-purple-deep">
                  <ImageSlot
                    label={editorialPosts[1].imageLabel}
                    imageUrl={editorialPosts[1].imageUrl}
                    className="w-full h-[96px] rounded-lg"
                    tone="pink"
                  />
                  <h3 className="font-heading text-[13.5px] font-bold leading-snug mt-2.5 group-hover:text-rose transition-colors line-clamp-2">
                    {editorialPosts[1].title}
                  </h3>
                </Link>
              )}
              {editorialPosts[2] && (
                <Link href={`/blog/${editorialPosts[2].slug}`} className="group block text-purple-deep">
                  <ImageSlot
                    label={editorialPosts[2].imageLabel}
                    imageUrl={editorialPosts[2].imageUrl}
                    className="w-full h-[96px] rounded-lg"
                    tone="cream"
                  />
                  <h3 className="font-heading text-[13.5px] font-bold leading-snug mt-2.5 group-hover:text-rose transition-colors line-clamp-2">
                    {editorialPosts[2].title}
                  </h3>
                </Link>
              )}
            </div>

            {/* Card 4 */}
            {editorialPosts[3] && (
              <Link href={`/blog/${editorialPosts[3].slug}`} className="group block text-purple-deep">
                <ImageSlot
                  label={editorialPosts[3].imageLabel}
                  imageUrl={editorialPosts[3].imageUrl}
                  className="w-full h-[220px] rounded-lg"
                  tone="purple"
                />
                <h3 className="font-heading text-[15px] font-bold leading-snug my-3 group-hover:text-rose transition-colors">
                  {editorialPosts[3].title}
                </h3>
              </Link>
            )}

            {/* Card 5 */}
            {editorialPosts[4] && (
              <Link href={`/blog/${editorialPosts[4].slug}`} className="group block text-purple-deep">
                <ImageSlot
                  label={editorialPosts[4].imageLabel}
                  imageUrl={editorialPosts[4].imageUrl}
                  className="w-full h-[220px] rounded-lg"
                  tone="mauve"
                />
                <h3 className="font-heading text-[15px] font-bold leading-snug my-3 group-hover:text-rose transition-colors">
                  {editorialPosts[4].title}
                </h3>
              </Link>
            )}
          </div>
        </section>

        {/* Hero Row: Recent list (left) / Main story (center) / Side stories (right) */}
        <section
          id="recent-posts"
          className="grid grid-cols-1 lg:grid-cols-[220px_1.6fr_260px] gap-7 px-6 md:px-12 py-8 max-w-[1200px] mx-auto scroll-mt-20"
        >
          {/* Left Column: 4 Recent Posts */}
          <div className="flex flex-col gap-5 order-2 lg:order-1">
            {recentList.map((rl) => (
              <Link key={rl.id} href={`/blog/${rl.slug}`} className="group flex gap-3 text-purple-deep">
                <ImageSlot
                  label={rl.imageLabel}
                  imageUrl={rl.imageUrl}
                  className="w-14 h-14 shrink-0 rounded-md"
                  tone="mauve"
                />
                <div>
                  <h3 className="font-heading text-[13.5px] font-bold leading-snug mb-1 group-hover:text-rose transition-colors line-clamp-2">
                    {rl.title}
                  </h3>
                  <p className="text-[11.5px] text-tan leading-snug line-clamp-2">{rl.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Center Column: Hero Main Blog */}
          <div className="order-1 lg:order-2">
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="group block text-purple-deep">
                <ImageSlot
                  label={featuredPost.imageLabel}
                  imageUrl={featuredPost.imageUrl}
                  className="w-full h-[340px] rounded-lg"
                  tone="mauve"
                />
                <div className="text-[11.5px] font-bold tracking-wide uppercase text-rose my-3">
                  {featuredPost.topicLabel || featuredPost.category || "Wardrobe"}
                </div>
                <h2 className="font-heading text-2xl md:text-[30px] font-bold leading-tight mb-3 text-purple-deep group-hover:text-rose transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-[15px] leading-relaxed text-tan-dark mb-2.5 line-clamp-3">
                  {featuredPost.excerpt}
                </p>
                <div className="text-xs text-tan uppercase tracking-wide">
                  BY {featuredPost.author.toUpperCase()} · {formatDate(featuredPost.publishedAt).toUpperCase()}
                </div>
              </Link>
            )}
          </div>

          {/* Right Column: 2 Side Stories */}
          <div className="flex flex-col gap-6 order-3">
            {sideStories.map((ss) => (
              <Link key={ss.id} href={`/blog/${ss.slug}`} className="group block text-purple-deep">
                <ImageSlot
                  label={ss.imageLabel}
                  imageUrl={ss.imageUrl}
                  className="w-full h-[150px] rounded-lg"
                  tone="pink"
                />
                <h3 className="font-heading text-[15px] font-bold leading-snug mt-2.5 group-hover:text-rose transition-colors line-clamp-2">
                  {ss.title}
                </h3>
                <p className="text-xs text-tan mt-1.5 leading-snug line-clamp-2">{ss.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Section: REVIEWS */}
        <section id="reviews" className="px-6 md:px-12 pb-2 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-black text-purple-deep tracking-tight">
              REVIEWS
            </h2>
            <Link
              href="#reviews"
              className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors"
            >
              View All &raquo;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-9 border-b border-[#f3e6d0]">
            {reviews.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="group text-purple-deep">
                <ImageSlot
                  label={r.imageLabel}
                  imageUrl={r.imageUrl}
                  className="w-full h-[150px] rounded-lg"
                  tone="mauve"
                />
                <h3 className="font-heading text-base font-bold leading-snug my-3 group-hover:text-rose transition-colors line-clamp-2">
                  {r.title}
                </h3>
                <p className="text-[13px] text-tan-dark leading-relaxed mb-2 line-clamp-2">{r.excerpt}</p>
                <div className="text-[11px] text-tan uppercase tracking-wide">
                  {formatDate(r.publishedAt).toUpperCase()} · {r.category.toUpperCase()}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section: CARE */}
        <section id="care" className="px-6 md:px-12 pt-9 pb-2 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-black text-purple-deep tracking-tight">
              CARE
            </h2>
            <Link
              href="#care"
              className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors"
            >
              View All &raquo;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-9 border-b border-[#f3e6d0]">
            {care.map((c) => (
              <Link key={c.id} href={`/blog/${c.slug}`} className="group text-purple-deep">
                <ImageSlot
                  label={c.imageLabel}
                  imageUrl={c.imageUrl}
                  className="w-full h-[150px] rounded-lg"
                  tone="pink"
                />
                <h3 className="font-heading text-base font-bold leading-snug my-3 group-hover:text-rose transition-colors line-clamp-2">
                  {c.title}
                </h3>
                <p className="text-[13px] text-tan-dark leading-relaxed mb-2 line-clamp-2">{c.excerpt}</p>
                <div className="text-[11px] text-tan uppercase tracking-wide">
                  {formatDate(c.publishedAt).toUpperCase()} · {c.category.toUpperCase()}
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Section: GUIDES (One large + text) */}
        <section id="guides" className="px-6 md:px-12 pt-9 pb-14 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-black text-purple-deep tracking-tight">
              GUIDES
            </h2>
            <Link
              href="#guides"
              className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors"
            >
              View All &raquo;
            </Link>
          </div>
          {guidePost && (
            <Link
              href={`/blog/${guidePost.slug}`}
              className="group grid grid-cols-1 md:grid-cols-2 gap-8 items-center text-purple-deep"
            >
              <ImageSlot
                label={guidePost.imageLabel}
                imageUrl={guidePost.imageUrl}
                className="w-full h-[320px] rounded-xl"
                tone="mauve"
              />
              <div>
                <div className="text-[11.5px] font-bold tracking-wide uppercase text-rose mb-2.5">
                  {guidePost.topicLabel || "Guide"}
                </div>
                <h3 className="font-heading text-2xl md:text-[26px] font-bold leading-tight mb-3 group-hover:text-rose transition-colors">
                  {guidePost.title}
                </h3>
                <p className="text-[14.5px] leading-relaxed text-tan-dark mb-2.5">
                  {guidePost.excerpt}
                </p>
                <div className="text-xs text-tan uppercase tracking-wide">
                  {formatDate(guidePost.publishedAt).toUpperCase()} · GUIDES
                </div>
              </div>
            </Link>
          )}
        </section>
      </main>

      <SiteFooter />
    </>
  );
}

