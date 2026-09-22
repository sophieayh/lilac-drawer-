import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import InlineNewsletterForm from "@/components/InlineNewsletterForm";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import HomeCommunityPostCard from "@/components/community/HomeCommunityPostCard";
import HomeCommunityCommentCard from "@/components/community/HomeCommunityCommentCard";
import {
  getHomeSpreadPosts,
  getNewHomePosts,
  getHomeFeaturedDeals,
  getTopPicks,
  getHomeReviews,
  getHomeBlogPreview,
  getHomeGuidePost,
  getHomeHeroPost,
  getDailyHomeCommunityHighlights,
  formatPrice,
  daysAgoLabel,
  formatDate,
} from "@/db/queries";

// ISR: revalidate DB-backed content every 60s instead of only at build/deploy time.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: `${siteConfig.name} — Honest Reviews & Buying Guides`,
  description: siteConfig.description,
  path: "/",
});

export default async function HomePage() {
  const [
    spreadPosts,
    newPosts,
    homeDeals,
    topPicks,
    homeReviews,
    homeBlogPreview,
    homeGuidePost,
    homeHeroPost,
    communityHighlights,
  ] = await Promise.all([
    getHomeSpreadPosts(2),
    getNewHomePosts(),
    getHomeFeaturedDeals(),
    getTopPicks(),
    getHomeReviews(),
    getHomeBlogPreview(),
    getHomeGuidePost(),
    getHomeHeroPost(),
    getDailyHomeCommunityHighlights(),
  ]);

  const topSpread = spreadPosts[0];
  const bottomSpread = spreadPosts[1];
  const heroPost = homeHeroPost || homeGuidePost || spreadPosts[0] || null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
          ],
        }}
      />
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen">
        {/* monochrome editorial spread */}
        {spreadPosts.length > 0 && (
          <Reveal delay={0}>
            <section className="px-4 sm:px-6 md:px-12 py-6 sm:py-8 max-w-[1200px] mx-auto bg-mauve-50 rounded-2xl border border-border-mauve">
              <div className="border-t-[3px] border-b-[3px] border-double border-lilac h-1.5 mb-6" />

              {topSpread && (
                <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-6 items-center">
                  <div>
                    <Link href={`/blog/${topSpread.slug}`} className="block group">
                      <p className="font-heading italic text-[24px] sm:text-[28px] md:text-[32px] font-bold mb-3 text-purple group-hover:text-rose transition-colors uppercase leading-tight">
                        {topSpread.title}
                      </p>
                    </Link>
                    <p className="text-sm leading-relaxed text-tan-dark text-justify">
                      {topSpread.excerpt}
                    </p>
                    <Link href={`/blog/${topSpread.slug}`} className="inline-block mt-3 text-xs font-semibold text-rose hover:underline">
                      Read article →
                    </Link>
                  </div>
                  <Link href={`/blog/${topSpread.slug}`} className="block">
                    <ImageSlot
                      label={topSpread.imageLabel}
                      imageUrl={topSpread.imageUrl}
                      className="w-full h-[200px] sm:h-[260px]"
                      shape="rounded"
                      radius={16}
                      tone="pink"
                    />
                  </Link>
                </div>
              )}

              {bottomSpread && (
                <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center">
                  <Link href={`/blog/${bottomSpread.slug}`} className="block order-2 md:order-1">
                    <ImageSlot
                      label={bottomSpread.imageLabel}
                      imageUrl={bottomSpread.imageUrl}
                      className="w-full h-[180px] sm:h-[220px]"
                      shape="rounded"
                      radius={16}
                      tone="mauve"
                    />
                  </Link>
                  <div className="order-1 md:order-2">
                    <Link href={`/blog/${bottomSpread.slug}`} className="block group">
                      <p className="font-heading italic text-[18px] sm:text-[20px] md:text-[22px] font-bold mb-2.5 sm:mb-3 text-purple group-hover:text-rose transition-colors uppercase leading-snug">
                        {bottomSpread.title}
                      </p>
                    </Link>
                    <p className="text-[13.5px] leading-relaxed text-tan-dark">
                      {bottomSpread.excerpt}
                    </p>
                    <Link href={`/blog/${bottomSpread.slug}`} className="inline-block mt-3 text-xs font-semibold text-rose hover:underline">
                      Read article →
                    </Link>
                  </div>
                </div>
              )}

              <div className="mt-6 border-2 border-lilac p-1 rounded-2xl">
                <div className="border border-lilac rounded-[11px] flex flex-wrap justify-center sm:justify-between items-center px-3 sm:px-6 py-2.5 sm:py-3 bg-rose text-white font-heading text-xs sm:text-sm font-bold tracking-wide uppercase gap-2 text-center">
                  <span>Cool Vibes</span>
                  <span className="hidden xs:inline">•</span>
                  <span>Lilac Drawer</span>
                  <span className="hidden xs:inline">•</span>
                  <span>Aesthetic</span>
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* main 3-column */}
        <Reveal delay={100}>
          <section className="grid lg:grid-cols-[2fr_1fr] gap-8 lg:gap-10 px-4 sm:px-6 md:px-12 py-8 sm:py-16 max-w-[1400px] mx-auto">
            {heroPost && (
              <article>
                <Link href={`/blog/${heroPost.slug}`} className="block group">
                  <ImageSlot
                    label={heroPost.imageLabel || heroPost.title}
                    imageUrl={heroPost.imageUrl}
                    className="w-full h-[220px] sm:h-[300px] md:h-[380px] shadow-[0_12px_32px_rgba(46,37,54,0.1)] group-hover:opacity-95 transition-opacity"
                    shape="rounded"
                    radius={20}
                    tone="mauve"
                  />
                </Link>
                <span className="inline-block bg-pink-100 text-rose text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full my-4 sm:my-5">
                  {heroPost.topicLabel || heroPost.category || "Editor's Pick"}
                </span>
                <Link href={`/blog/${heroPost.slug}`} className="block group">
                  <h1 className="font-heading text-[26px] sm:text-[32px] md:text-[42px] leading-tight mb-2.5 font-bold text-purple-deep tracking-tight group-hover:text-rose transition-colors">
                    {heroPost.title}
                  </h1>
                </Link>
                <div className="text-[13px] text-tan mb-4">
                  by {heroPost.author} · updated {formatDate(heroPost.updatedAt || heroPost.publishedAt)}
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-tan-dark">
                  {heroPost.excerpt}{" "}
                  <Link
                    href={`/blog/${heroPost.slug}`}
                    className="font-semibold text-rose hover:underline inline-flex items-center gap-1 group"
                  >
                    <span>Read the full review</span>
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                </p>
              </article>
            )}

            <aside className="bg-white border border-border shadow-xs rounded-2xl p-5.5">
              <div className="flex justify-between items-baseline mb-3">
                <h3 className="font-heading text-base text-rose uppercase tracking-wide">
                  Today&apos;s Picks
                </h3>
                <Link
                  href="/deals/today-deals"
                  className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
              {homeDeals.map((d) => (
                <Link
                  key={d.id}
                  href={`/deals/${d.slug}`}
                  className="flex gap-3.5 py-3.5 border-b border-pink-100 card-hover group"
                >
                  <ImageSlot label={d.imageLabel} imageUrl={d.imageUrl} className="w-16 h-16 shrink-0" shape="rounded" radius={12} tone="pink" />
                  <div>
                    <div className="text-sm font-medium leading-snug group-hover:text-rose transition-colors">{d.name}</div>
                    <div className="text-[13px] mt-1.5">
                      <span className="text-rose font-bold">{formatPrice(d.priceCents)}</span>{" "}
                      {d.compareAtPriceCents ? (
                        <span className="text-lilac/70 line-through ml-1.5">{formatPrice(d.compareAtPriceCents)}</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}

              <div className="flex justify-between items-baseline mt-6 mb-3">
                <h3 className="font-heading text-base text-gold uppercase tracking-wide">
                  New + Updated
                </h3>
                <Link
                  href="/blog/all"
                  className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
                >
                  <span>View All</span>
                  <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
              {newPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="block py-3.5 border-b border-pink-100 text-purple-deep group"
                >
                  <div className="text-[15px] leading-snug font-medium group-hover:text-rose transition-colors">{p.title}</div>
                  <div className="text-xs text-tan mt-1.5 uppercase tracking-wide">{daysAgoLabel(p.publishedAt)}</div>
                </Link>
              ))}

              {/* 24h Community Highlight - Slot 1 (Sidebar) */}
              {communityHighlights.sidebarItem && (
                communityHighlights.sidebarItem.type === "post" ? (
                  <HomeCommunityPostCard post={communityHighlights.sidebarItem.post} variant="compact" />
                ) : (
                  <HomeCommunityCommentCard comment={communityHighlights.sidebarItem.comment} variant="compact" />
                )
              )}
            </aside>
          </section>
        </Reveal>

        {/* top picks */}
        <Reveal delay={100}>
          <section id="top-picks" className="px-4 sm:px-6 md:px-12 pb-12 sm:pb-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-lilac pb-3.5">
              <h2 className="font-heading text-xl sm:text-[26px] text-purple m-0">Top 10 Lint Removers, Ranked</h2>
              <Link
                href="/deals/best-sellers"
                className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
              >
                <span>View All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            {topPicks.map((pick) => (
              <Link
                key={pick.id}
                href={`/deals/${pick.slug}`}
                className="flex items-center gap-3 sm:gap-5 px-3.5 sm:px-4.5 py-3 sm:py-4 mb-2.5 rounded-2xl bg-white border border-border/80 card-hover group block shadow-2xs"
              >
                <span className="font-heading text-xl sm:text-[28px] text-lilac font-bold w-8 sm:w-11 shrink-0">
                  {pick.rank != null ? String(pick.rank).padStart(2, "0") : "–"}
                </span>
                <ImageSlot label={pick.imageLabel} imageUrl={pick.imageUrl} className="w-14 h-14 sm:w-20 sm:h-20 shrink-0" shape="rounded" radius={12} tone="pink" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-xs sm:text-[15px] group-hover:text-rose transition-colors truncate sm:whitespace-normal">{pick.name}</div>
                  <div className="text-[11px] sm:text-[13px] text-tan mt-0.5 sm:mt-1 line-clamp-1">{pick.rankNote}</div>
                </div>
                <div className="font-heading font-bold text-sm sm:text-[17px] text-rose shrink-0">{formatPrice(pick.priceCents)}</div>
              </Link>
            ))}
          </section>
        </Reveal>

        {/* 24h Trending Post Banner - Slot 2 */}
        {communityHighlights.bannerPost && (
          <Reveal delay={100}>
            <HomeCommunityPostCard post={communityHighlights.bannerPost} variant="banner" />
          </Reveal>
        )}

        {/* latest reviews */}
        <Reveal delay={100}>
          <section id="reviews" className="px-4 sm:px-6 md:px-12 pb-12 sm:pb-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-border-mauve pb-3.5">
              <h2 className="font-heading text-xl sm:text-[26px] text-purple-deep m-0">Latest Reviews</h2>
              <Link
                href="/blog/reviews"
                className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
              >
                <span>View All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-7">
              {homeReviews.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="block text-purple-deep card-hover">
                  <ImageSlot
                    label={r.imageLabel}
                    imageUrl={r.imageUrl}
                    className="w-full h-[180px] sm:h-[200px] mb-3.5 shadow-[0_6px_18px_rgba(46,37,54,0.08)]"
                    shape="rounded"
                    radius={16}
                    tone="mauve"
                  />
                  <span className="text-xs font-semibold text-rose uppercase tracking-wide">
                    {r.topicLabel ?? r.category}
                  </span>
                  <h3 className="font-heading text-base sm:text-[19px] my-1.5 sm:my-2 leading-snug text-purple-deep">
                    {r.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-tan-dark leading-relaxed line-clamp-3">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* 24h Reader Thoughts - Slot 3 */}
        {communityHighlights.readerComment && (
          <Reveal delay={100}>
            <HomeCommunityCommentCard comment={communityHighlights.readerComment} variant="quote" />
          </Reveal>
        )}

        {/* buying guide banner */}
        {homeGuidePost && (
          <Reveal delay={100}>
            <section id="guides" className="bg-mauve-100 py-12 sm:py-22 px-4 sm:px-6 md:px-12">
              <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center max-w-[1400px] mx-auto">
                <Link href={`/blog/${homeGuidePost.slug}`} className="block">
                  <ImageSlot
                    label={homeGuidePost.imageLabel || homeGuidePost.title}
                    imageUrl={homeGuidePost.imageUrl}
                    className="w-full h-[220px] sm:h-[340px] shadow-[0_12px_32px_rgba(46,37,54,0.12)]"
                    shape="rounded"
                    radius={20}
                    tone="purple"
                  />
                </Link>
                <div>
                  <span className="inline-block bg-lilac text-white text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mb-3 sm:mb-4.5">
                    {homeGuidePost.topicLabel || homeGuidePost.category || "Buying Guide"}
                  </span>
                  <Link href={`/blog/${homeGuidePost.slug}`} className="block group">
                    <h2 className="font-heading text-2xl sm:text-[30px] leading-tight mb-3 sm:mb-4 text-purple-deep group-hover:text-rose transition-colors">
                      {homeGuidePost.title}
                    </h2>
                  </Link>
                  <p className="text-sm sm:text-[15px] leading-relaxed text-tan-dark mb-5 max-w-[460px]">
                    {homeGuidePost.excerpt}
                  </p>
                  <Link
                    href={`/blog/${homeGuidePost.slug}`}
                    className="inline-block bg-purple-deep text-white px-5 sm:px-6.5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm shadow-[0_4px_14px_rgba(46,37,54,0.2)] hover:bg-purple-deep/90 transition-colors"
                  >
                    Read the Guide →
                  </Link>
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* blog */}
        <Reveal delay={100}>
          <section id="blog" className="px-4 sm:px-6 md:px-12 py-12 sm:py-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-border-mauve pb-3.5">
              <h2 className="font-heading text-xl sm:text-[26px] text-purple-deep m-0">From the Blog</h2>
              <Link
                href="/blog/all"
                className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
              >
                <span>View All</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-7">
              {homeBlogPreview.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3.5 text-purple-deep card-hover">
                  <ImageSlot label={p.imageLabel} imageUrl={p.imageUrl} className="w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] shrink-0" shape="rounded" radius={12} tone="mauve" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] sm:text-xs text-tan mb-1">{formatDate(p.publishedAt)}</div>
                    <h3 className="font-heading text-sm sm:text-base leading-snug text-purple-deep line-clamp-2">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* 24h Community Buzz / Spotlight - Slot 4 (Two Cards) */}
        {communityHighlights.spotlightItems && communityHighlights.spotlightItems.length > 0 && (
          <Reveal delay={100}>
            <section className="px-4 sm:px-6 md:px-12 pb-12 sm:pb-16 max-w-[1400px] mx-auto">
              <div className="flex justify-between items-baseline mb-6 border-b-2 border-border-mauve pb-3.5">
                <h2 className="font-heading text-xl sm:text-[26px] text-purple-deep m-0">
                  Community Buzz
                </h2>
                <Link
                  href="/community"
                  className="text-xs font-bold tracking-wider uppercase text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
                >
                  <span>Join Conversation</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </Link>
              </div>
              <div className="grid md:grid-cols-2 gap-5 sm:gap-6 items-stretch">
                {communityHighlights.spotlightItems.map((item, idx) =>
                  item.type === "post" ? (
                    <HomeCommunityPostCard
                      key={`buzz-post-${item.post.id}-${idx}`}
                      post={item.post}
                      variant="spotlight"
                    />
                  ) : (
                    <HomeCommunityCommentCard
                      key={`buzz-comment-${item.comment.id}-${idx}`}
                      comment={item.comment}
                      variant="spotlight"
                    />
                  )
                )}
              </div>
            </section>
          </Reveal>
        )}

        {/* newsletter */}
        <Reveal delay={100}>
          <section id="subscribe" className="bg-pink-100 py-12 sm:py-22 px-4 sm:px-6 text-center">
            <h2 className="font-heading text-2xl sm:text-[30px] mb-2 sm:mb-3 text-plum">
              Get the weekly pick in your inbox
            </h2>
            <p className="text-xs sm:text-[15px] text-plum/80 mb-5 sm:mb-6">
              One product, tested and worth it. Every Thursday.
            </p>
            <InlineNewsletterForm />
          </section>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
