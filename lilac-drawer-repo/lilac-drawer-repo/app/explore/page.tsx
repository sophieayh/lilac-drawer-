import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import ExploreProductSection from "@/components/explore/ExploreProductSection";
import {
  getAllProducts,
  getExploreCategories,
  getExploreDeals,
  getSavedPicks,
  getRecentBlogPosts,
  getCommunityFeed,
  formatPrice,
  formatPriceFixed,
} from "@/db/queries";
import { calculateDiscountPercent } from "@/lib/format";
import { slugify } from "@/lib/slugify";
import { buildMetadata } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Explore Products & Verified Deals",
  description: "Discover curated beauty, personal care, tech, and lifestyle picks with verified discounts and tested reviews on Lilac Drawer.",
  path: "/explore",
});

function renderCategoryIcon(label: string, slug?: string | null) {
  const s = `${slug || ""} ${label}`.toLowerCase();
  if (s.includes("beauty") || s.includes("makeup") || s.includes("cosmetic")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    );
  }
  if (s.includes("care") || s.includes("clothing") || s.includes("steamer") || s.includes("laundry")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    );
  }
  if (s.includes("wardrobe") || s.includes("storage") || s.includes("closet") || s.includes("organizer")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  }
  if (s.includes("jewelry") || s.includes("watch") || s.includes("ring") || s.includes("necklace")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  }
  if (s.includes("bag") || s.includes("accessor") || s.includes("tote") || s.includes("wallet")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    );
  }
  if (s.includes("tech") || s.includes("pc") || s.includes("laptop") || s.includes("gaming") || s.includes("electronic")) {
    return (
      <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

export default async function ExplorePage() {
  const [
    allProducts,
    exploreCategories,
    exploreDeals,
    exploreSaved,
    recentArticles,
    communityPostsList,
  ] = await Promise.all([
    getAllProducts(),
    getExploreCategories(),
    getExploreDeals(4),
    getSavedPicks(4),
    getRecentBlogPosts(),
    getCommunityFeed(3),
  ]);

  // Featured Hero Deal Spotlight (pick the highest discount product or first deal)
  const heroDeal = exploreDeals.length > 0 ? exploreDeals[0] : allProducts[0];
  const heroDiscount = heroDeal
    ? heroDeal.discountPercent ?? calculateDiscountPercent(heroDeal.priceCents, heroDeal.compareAtPriceCents)
    : null;

  return (
    <>
      <SiteHeader />
      <div className="bg-cream text-purple-deep min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
          {/* Main Feed Column */}
          <main className="flex flex-col gap-10 min-w-0">
            {/* 1. HERO DISCOVERY BANNER */}
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-mauve-100 via-mauve-50 to-pink-50 border border-border p-6 md:p-10 shadow-xs">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-8 items-center relative z-10">
                <div>
                  <div className="inline-flex items-center gap-2 bg-white/90 border border-border/80 text-rose text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full mb-4 shadow-xs">
                    <svg className="w-3.5 h-3.5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    <span>Curated Discovery Hub</span>
                    <span>•</span>
                    <span>{allProducts.length}+ Tested Items</span>
                  </div>

                  <h1 className="font-heading text-3xl md:text-4xl lg:text-[42px] leading-tight text-purple-deep font-bold mb-3">
                    Explore Tested Picks &amp; Verified Deals
                  </h1>

                  <p className="text-sm md:text-base text-tan-dark max-w-[540px] mb-6 leading-relaxed">
                    Compare real retailer prices, read honest editorial reviews, and uncover tested favorites across beauty, care, tech, and lifestyle.
                  </p>

                  {/* Quick Jump Keyword Pills */}
                  <div className="flex items-center gap-2 flex-wrap mb-6">
                    <span className="text-xs font-bold uppercase tracking-wider text-tan-dark">
                      Popular:
                    </span>
                    {["Beauty & Makeup", "Care", "PC", "Top Picks", "Deals"].map((tag) => (
                      <a
                        key={tag}
                        href="#explore-catalog"
                        className="text-xs font-semibold bg-white/80 hover:bg-white text-purple-deep px-3 py-1 rounded-lg border border-border/80 transition-colors shadow-xs"
                      >
                        {tag}
                      </a>
                    ))}
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href="#explore-catalog"
                      className="inline-flex items-center gap-2 bg-purple-deep text-white text-xs md:text-sm font-bold px-6 py-3 rounded-full hover:bg-purple-deep/90 transition-all shadow-sm"
                    >
                      <span>Browse Complete Catalog ({allProducts.length})</span>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </a>
                    <Link
                      href="/deals"
                      className="inline-flex items-center gap-1.5 bg-white border border-border text-purple-deep text-xs md:text-sm font-bold px-5 py-3 rounded-full hover:bg-mauve-50 transition-all shadow-xs"
                    >
                      <span>All Deals Hub</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>

                {/* Hero Spotlight Card */}
                {heroDeal && (
                  <div className="bg-white/90 backdrop-blur-sm border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between group">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-wider text-rose bg-pink-100 px-2.5 py-0.5 rounded-full">
                        <svg className="w-3 h-3 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                        <span>Featured Spotlight</span>
                      </span>
                      {heroDiscount ? (
                        <span className="text-[11px] font-bold text-white bg-rose px-2 py-0.5 rounded-full">
                          -{heroDiscount}% OFF
                        </span>
                      ) : null}
                    </div>

                    <Link href={`/deals/${heroDeal.slug}`} className="block relative mb-3">
                      <div className="aspect-[4/3] rounded-xl overflow-hidden bg-mauve-50 flex items-center justify-center p-2">
                        <ImageSlot
                          imageUrl={heroDeal.imageUrl}
                          label={heroDeal.imageLabel || heroDeal.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          shape="rounded"
                          radius={12}
                          tone="mauve"
                        />
                      </div>
                    </Link>

                    <Link href={`/deals/${heroDeal.slug}`} className="block">
                      <h3 className="font-heading text-sm font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-1 mb-1">
                        {heroDeal.name}
                      </h3>
                    </Link>
                    <p className="text-[11px] text-tan-dark line-clamp-1 mb-2">
                      {heroDeal.subtitle || heroDeal.category}
                    </p>

                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-heading font-bold text-lg text-rose">
                        {formatPrice(heroDeal.priceCents)}
                      </span>
                      {heroDeal.compareAtPriceCents ? (
                        <span className="text-xs text-tan line-through">
                          {formatPriceFixed(heroDeal.compareAtPriceCents)}
                        </span>
                      ) : null}
                    </div>

                    <Link
                      href={`/deals/${heroDeal.slug}`}
                      className="w-full text-center py-2 px-3 rounded-xl bg-purple-deep text-white text-xs font-bold hover:bg-purple-deep/90 transition-all shadow-xs"
                    >
                      View Deal Details →
                    </Link>
                  </div>
                )}
              </div>

              {/* Background ambient lighting */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-pink-200/40 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* 2. BROWSE BY CATEGORY */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-heading text-xl md:text-2xl text-purple-deep font-bold">
                    Explore by Category
                  </h2>
                  <p className="text-xs text-tan-dark mt-0.5">
                    Jump straight into your favorite lifestyle and tech departments.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
                {exploreCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug || slugify(c.label)}`}
                    className="flex flex-col items-center gap-2.5 bg-white border border-border rounded-2xl py-4 px-3 hover:bg-mauve-50 hover:border-lilac/60 transition-all shadow-xs group"
                  >
                    <span
                      className="w-12 h-12 rounded-full flex items-center justify-center text-purple-deep shadow-2xs group-hover:scale-110 transition-transform"
                      style={{ background: c.colorHex ?? "#f4ebf8" }}
                      aria-hidden="true"
                    >
                      {renderCategoryIcon(c.label, c.slug)}
                    </span>
                    <span className="text-xs font-bold text-purple-deep text-center group-hover:text-rose transition-colors">
                      {c.label}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* 3. HOT FLASH DEALS & PRICE DROPS */}
            {exploreDeals.length > 0 && (
              <section className="bg-cream-alt border border-border rounded-3xl p-6 md:p-7 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose mb-1">
                      <svg className="w-3.5 h-3.5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                      <span>Verified Price Drops</span>
                    </div>
                    <h2 className="font-heading text-2xl text-purple-deep font-bold">
                      Top Deals for You Today
                    </h2>
                  </div>
                  <Link
                    href="/deals"
                    className="text-xs md:text-sm font-bold text-purple-deep hover:text-rose transition-colors flex items-center gap-1"
                  >
                    <span>View All Deals</span>
                    <span>→</span>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {exploreDeals.map((d) => {
                    const discount =
                      d.discountPercent ?? calculateDiscountPercent(d.priceCents, d.compareAtPriceCents);
                    const savedCents =
                      d.compareAtPriceCents && d.compareAtPriceCents > d.priceCents
                        ? d.compareAtPriceCents - d.priceCents
                        : 0;

                    return (
                      <div
                        key={d.id}
                        className="bg-white border border-border rounded-2xl p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <Link href={`/deals/${d.slug}`} className="block relative mb-3">
                            <div className="aspect-square rounded-xl overflow-hidden bg-mauve-50 flex items-center justify-center p-2 border border-border/60">
                              <ImageSlot
                                label={d.imageLabel || d.name}
                                imageUrl={d.imageUrl}
                                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                                shape="rounded"
                                radius={12}
                                tone="mauve"
                              />
                            </div>
                            {discount ? (
                              <span className="absolute top-2 left-2 bg-rose text-white text-[10.5px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                                -{discount}% OFF
                              </span>
                            ) : null}
                          </Link>

                          <div className="text-[11px] font-bold uppercase tracking-wider text-rose mb-1">
                            {d.category}
                          </div>

                          <Link href={`/deals/${d.slug}`} className="block group/title mb-1">
                            <h3 className="text-sm font-bold text-purple-deep group-hover/title:text-rose transition-colors line-clamp-1">
                              {d.name}
                            </h3>
                          </Link>

                          <p className="text-xs text-tan-dark mb-2 line-clamp-1">{d.subtitle}</p>

                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-heading font-bold text-base text-rose">
                              {formatPrice(d.priceCents)}
                            </span>
                            {d.compareAtPriceCents ? (
                              <span className="text-xs text-tan line-through">
                                {formatPriceFixed(d.compareAtPriceCents)}
                              </span>
                            ) : null}
                          </div>

                          {savedCents > 0 && (
                            <div className="text-[10.5px] font-semibold text-sage mb-3">
                              Save {formatPriceFixed(savedCents)}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/deals/${d.slug}`}
                          className="w-full text-center py-2 px-3 rounded-xl bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          Explore Deal →
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 4. ALL PRODUCTS EXPLORER (Client Interactive Component) */}
            <ExploreProductSection initialProducts={allProducts} />

            {/* 5. EDITORIAL BUYING GUIDES & REVIEWS */}
            {recentArticles.length > 0 && (
              <section className="border-t border-border pt-8">
                <div className="flex items-baseline justify-between mb-5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose mb-1">
                      <svg className="w-3.5 h-3.5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <span>Editorial Reviews</span>
                    </div>
                    <h2 className="font-heading text-2xl text-purple-deep font-bold">
                      In-Depth Guides &amp; Comparisons
                    </h2>
                  </div>
                  <Link
                    href="/blog"
                    className="text-xs md:text-sm font-bold text-purple-deep hover:text-rose transition-colors"
                  >
                    View All Guides →
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {recentArticles.slice(0, 2).map((article) => (
                    <Link
                      key={article.id}
                      href={`/blog/${article.slug}`}
                      className="bg-white border border-border rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row gap-4 group"
                    >
                      <div className="w-full sm:w-36 h-32 shrink-0 rounded-2xl overflow-hidden bg-mauve-50 flex items-center justify-center border border-border/60">
                        <ImageSlot
                          label={article.imageLabel || article.title}
                          imageUrl={article.imageUrl}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          shape="rounded"
                          radius={16}
                          tone="mauve"
                        />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-rose mb-1">
                            <span>{article.category}</span>
                            {article.topicLabel && (
                              <>
                                <span>•</span>
                                <span className="text-tan-dark">{article.topicLabel}</span>
                              </>
                            )}
                          </div>
                          <h3 className="font-heading text-base font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-xs text-tan-dark line-clamp-2 mt-1">
                              {article.excerpt}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-purple-deep group-hover:text-rose mt-2 inline-flex items-center gap-1">
                          <span>Read Full Guide</span>
                          <span>→</span>
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </main>

          {/* Right Sidebar */}
          <aside className="flex flex-col gap-6 h-fit">
            {/* 1. Saved Editor Picks */}
            <div className="bg-white border border-border rounded-3xl p-5 shadow-xs">
              <div className="flex justify-between items-center mb-4 pb-3 border-b border-border">
                <h3 className="font-heading text-base font-bold text-purple-deep flex items-center gap-2">
                  <svg className="w-4 h-4 text-rose" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span>Editor&apos;s Saved Picks</span>
                </h3>
                <span className="text-xs font-bold bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full">
                  {exploreSaved.length}
                </span>
              </div>

              <div className="flex flex-col">
                {exploreSaved.map((s) => (
                  <Link
                    key={s.id}
                    href={`/deals/${s.slug}`}
                    className="flex gap-3 py-3 border-b border-border last:border-b-0 group transition-colors"
                  >
                    <div className="w-14 h-14 shrink-0 rounded-xl overflow-hidden bg-mauve-50 flex items-center justify-center border border-border/60">
                      <ImageSlot
                        label={s.imageLabel || s.name}
                        imageUrl={s.imageUrl}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        shape="rounded"
                        radius={10}
                        tone="mauve"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-purple-deep leading-snug group-hover:text-rose transition-colors line-clamp-1">
                        {s.name}
                      </div>
                      <div className="text-[11px] text-tan-dark mt-0.5 truncate">{s.subtitle || s.category}</div>
                      <div className="font-heading font-bold text-xs text-rose mt-1">
                        {formatPrice(s.priceCents)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. Trending in Community */}
            {communityPostsList.length > 0 && (
              <div className="bg-white border border-border rounded-3xl p-5 shadow-xs">
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-border">
                  <h3 className="font-heading text-base font-bold text-purple-deep flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Community Buzz</span>
                  </h3>
                  <Link href="/community" className="text-xs font-bold text-rose hover:underline">
                    View All
                  </Link>
                </div>

                <div className="flex flex-col gap-3">
                  {communityPostsList.map((cp) => (
                    <Link
                      key={cp.id}
                      href={`/community/post/${cp.id}`}
                      className="p-3 rounded-2xl bg-mauve-50/50 hover:bg-mauve-50 border border-border/60 transition-colors block group"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-6 h-6 rounded-full bg-purple-deep text-white text-[10px] font-bold flex items-center justify-center uppercase shrink-0">
                          {cp.authorName ? cp.authorName[0] : "U"}
                        </div>
                        <span className="text-xs font-bold text-purple-deep group-hover:text-rose transition-colors truncate">
                          {cp.authorName}
                        </span>
                        <span className="text-[10.5px] text-tan-dark ml-auto">
                          @{cp.authorHandle}
                        </span>
                      </div>
                      <p className="text-xs text-purple-deep/90 line-clamp-2 leading-relaxed">
                        {cp.body}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. VIP Newsletter Card */}
            <div className="bg-gradient-to-br from-mauve-100 to-pink-100 border border-border rounded-3xl p-5 shadow-xs">
              <div className="font-heading text-base text-purple-deep font-bold mb-1">
                Join the Lilac Club
              </div>
              <p className="text-xs text-purple-deep/80 mb-4 leading-relaxed">
                Get notified first when new verified reviews and exclusive price drops land in the catalog.
              </p>
              <Link
                href="/#subscribe"
                className="w-full inline-block text-center bg-purple-deep text-white text-xs font-bold py-2.5 px-4 rounded-full hover:bg-purple-deep/90 transition-all shadow-xs"
              >
                Join for Free
              </Link>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
