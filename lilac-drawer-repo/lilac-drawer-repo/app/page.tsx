import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import Reveal from "@/components/Reveal";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import {
  getHomeSpreadPosts,
  getNewHomePosts,
  getHomeFeaturedDeals,
  getTopPicks,
  getHomeReviews,
  getHomeBlogPreview,
  getHomeGuidePost,
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
  const [spreadPosts, newPosts, homeDeals, topPicks, homeReviews, homeBlogPreview, homeGuidePost] =
    await Promise.all([
      getHomeSpreadPosts(2),
      getNewHomePosts(),
      getHomeFeaturedDeals(),
      getTopPicks(),
      getHomeReviews(),
      getHomeBlogPreview(),
      getHomeGuidePost(),
    ]);

  const topSpread = spreadPosts[0];
  const bottomSpread = spreadPosts[1];

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
            <section className="px-6 md:px-12 py-8 max-w-[1200px] mx-auto bg-gradient-to-br from-mauve-50 to-pink-200">
              <div className="border-t-[3px] border-b-[3px] border-double border-lilac h-1.5 mb-6" />

              {topSpread && (
                <div className="grid md:grid-cols-2 gap-8 mb-6 items-center">
                  <div>
                    <Link href={`/blog/${topSpread.slug}`} className="block group">
                      <p className="font-heading italic text-[30px] md:text-[32px] font-bold mb-3.5 text-purple group-hover:text-rose transition-colors uppercase leading-tight">
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
                      className="w-full h-[260px]"
                      shape="rounded"
                      radius={16}
                      tone="pink"
                    />
                  </Link>
                </div>
              )}

              {bottomSpread && (
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <Link href={`/blog/${bottomSpread.slug}`} className="block order-2 md:order-1">
                    <ImageSlot
                      label={bottomSpread.imageLabel}
                      imageUrl={bottomSpread.imageUrl}
                      className="w-full h-[220px]"
                      shape="rounded"
                      radius={16}
                      tone="mauve"
                    />
                  </Link>
                  <div className="order-1 md:order-2">
                    <Link href={`/blog/${bottomSpread.slug}`} className="block group">
                      <p className="font-heading italic text-[20px] md:text-[22px] font-bold mb-3 text-purple group-hover:text-rose transition-colors uppercase leading-snug">
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
                <div className="border border-lilac rounded-[11px] flex justify-between items-center px-6 py-3 bg-gradient-to-r from-rose to-lilac text-white font-heading text-sm font-bold tracking-wide uppercase">
                  <span>Cool Vibes</span>
                  <span>✦ Lilac Drawer ✦</span>
                  <span>Aesthetic</span>
                </div>
              </div>
            </section>
          </Reveal>
        )}

        {/* main 3-column */}
        <Reveal delay={100}>
          <section className="grid lg:grid-cols-[2fr_1fr] gap-10 px-6 md:px-12 py-16 max-w-[1400px] mx-auto">
            <article>
              <ImageSlot
                label="The Best Garment Steamer — hero product photo"
                className="w-full h-[380px] shadow-[0_12px_32px_rgba(46,37,54,0.1)]"
                shape="rounded"
                radius={20}
                tone="mauve"
              />
              <span className="inline-block bg-pink-100 text-rose text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full my-5">
                Editor&apos;s Pick
              </span>
              <h1 className="font-heading text-[32px] md:text-[42px] leading-tight mb-2.5 font-bold text-purple-deep tracking-tight">
                The Best Garment Steamer
              </h1>
              <div className="text-[13px] text-tan mb-4">by the Lilac Drawer editors · updated Aug 2026</div>
              <p className="text-base leading-relaxed text-tan-dark">
                We tested six garment steamers over three weeks of real laundry days. One pulled
                ahead on speed, water capacity, and how little it hissed at 6am.{" "}
                <Link href="/blog#reviews" className="font-semibold text-rose">
                  Read the full review →
                </Link>
              </p>
            </article>

            <aside className="bg-gradient-to-br from-pink-200 to-mauve-50 rounded-2xl p-5.5">
              <h3 className="font-heading text-base text-rose mb-4 uppercase tracking-wide">
                ♥ Today&apos;s Picks
              </h3>
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

              <h3 className="font-heading text-base text-gold mt-6 mb-4 uppercase tracking-wide">
                New + Updated
              </h3>
              {newPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="block py-3.5 border-b border-pink-100 text-purple-deep"
                >
                  <div className="text-[15px] leading-snug font-medium">{p.title}</div>
                  <div className="text-xs text-tan mt-1.5 uppercase tracking-wide">{daysAgoLabel(p.publishedAt)}</div>
                </Link>
              ))}
            </aside>
          </section>
        </Reveal>

        {/* top picks */}
        <Reveal delay={100}>
          <section id="top-picks" className="px-6 md:px-12 pb-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-lilac pb-3.5">
              <h2 className="font-heading text-[26px] text-purple m-0">Top 10 Lint Removers, Ranked</h2>
              <Link href="/deals" className="text-sm font-semibold">
                See full list →
              </Link>
            </div>
            {topPicks.map((pick) => (
              <Link
                key={pick.id}
                href={`/deals/${pick.slug}`}
                className="flex items-center gap-5 px-4.5 py-4 mb-2.5 rounded-2xl bg-gradient-to-r from-pink-200 to-mauve-50 card-hover group block"
              >
                <span className="font-heading text-[28px] text-lilac font-bold w-11">
                  {pick.rank != null ? String(pick.rank).padStart(2, "0") : "–"}
                </span>
                <ImageSlot label={pick.imageLabel} imageUrl={pick.imageUrl} className="w-20 h-20 shrink-0" shape="rounded" radius={14} tone="pink" />
                <div className="flex-1">
                  <div className="font-semibold text-[15px] group-hover:text-rose transition-colors">{pick.name}</div>
                  <div className="text-[13px] text-tan mt-1">{pick.rankNote}</div>
                </div>
                <div className="font-heading font-bold text-[17px] text-rose">{formatPrice(pick.priceCents)}</div>
              </Link>
            ))}
          </section>
        </Reveal>

        {/* latest reviews */}
        <Reveal delay={100}>
          <section id="reviews" className="px-6 md:px-12 pb-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-border-mauve pb-3.5">
              <h2 className="font-heading text-[26px] text-purple-deep m-0">Latest Reviews</h2>
              <Link href="/blog#reviews" className="text-sm font-semibold">
                All reviews →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-7">
              {homeReviews.map((r) => (
                <Link key={r.id} href={`/blog/${r.slug}`} className="block text-purple-deep card-hover">
                  <ImageSlot
                    label={r.imageLabel}
                    imageUrl={r.imageUrl}
                    className="w-full h-[200px] mb-3.5 shadow-[0_6px_18px_rgba(46,37,54,0.08)]"
                    shape="rounded"
                    radius={16}
                    tone="mauve"
                  />
                  <span className="text-xs font-semibold text-rose uppercase tracking-wide">
                    {r.topicLabel ?? r.category}
                  </span>
                  <h3 className="font-heading text-[19px] my-2 leading-snug text-purple-deep">
                    {r.title}
                  </h3>
                  <p className="text-sm text-tan-dark leading-relaxed">{r.excerpt}</p>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* buying guide banner */}
        {homeGuidePost && (
          <Reveal delay={100}>
            <section id="guides" className="bg-mauve-100 py-22 px-6 md:px-12">
              <div className="grid md:grid-cols-2 gap-12 items-center max-w-[1400px] mx-auto">
                <Link href={`/blog/${homeGuidePost.slug}`} className="block">
                  <ImageSlot
                    label={homeGuidePost.imageLabel || homeGuidePost.title}
                    imageUrl={homeGuidePost.imageUrl}
                    className="w-full h-[340px] shadow-[0_12px_32px_rgba(46,37,54,0.12)]"
                    shape="rounded"
                    radius={20}
                    tone="purple"
                  />
                </Link>
                <div>
                  <span className="inline-block bg-lilac text-white text-xs font-semibold uppercase tracking-wide px-3 py-1.5 rounded-full mb-4.5">
                    {homeGuidePost.topicLabel || homeGuidePost.category || "Buying Guide"}
                  </span>
                  <Link href={`/blog/${homeGuidePost.slug}`} className="block group">
                    <h2 className="font-heading text-[30px] leading-tight mb-4 text-purple-deep group-hover:text-rose transition-colors">
                      {homeGuidePost.title}
                    </h2>
                  </Link>
                  <p className="text-[15px] leading-relaxed text-tan-dark mb-5.5 max-w-[460px]">
                    {homeGuidePost.excerpt}
                  </p>
                  <Link
                    href={`/blog/${homeGuidePost.slug}`}
                    className="inline-block bg-purple-deep text-white px-6.5 py-3 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(46,37,54,0.2)] hover:bg-purple-deep/90 transition-colors"
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
          <section id="blog" className="px-6 md:px-12 py-20 max-w-[1400px] mx-auto">
            <div className="flex justify-between items-baseline mb-6 border-b-2 border-border-mauve pb-3.5">
              <h2 className="font-heading text-[26px] text-purple-deep m-0">From the Blog</h2>
              <Link href="/blog" className="text-sm font-semibold">
                All posts →
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-7">
              {homeBlogPreview.map((p) => (
                <Link key={p.id} href={`/blog/${p.slug}`} className="flex gap-3.5 text-purple-deep card-hover">
                  <ImageSlot label={p.imageLabel} imageUrl={p.imageUrl} className="w-[100px] h-[100px] shrink-0" shape="rounded" radius={12} tone="mauve" />
                  <div>
                    <div className="text-xs text-tan mb-1.5">{formatDate(p.publishedAt)}</div>
                    <h3 className="font-heading text-base leading-snug text-purple-deep">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </Reveal>

        {/* newsletter */}
        <Reveal delay={100}>
          <section id="subscribe" className="bg-pink-100 py-22 px-6 text-center">
            <h2 className="font-heading text-[30px] mb-3 text-plum">
              Get the weekly pick in your inbox
            </h2>
            <p className="text-[15px] text-plum/80 mb-6">
              One product, tested and worth it. Every Thursday.
            </p>
            <form className="flex justify-center gap-3 max-w-[420px] mx-auto">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                placeholder="you@email.com"
                className="flex-1 px-4.5 py-3.5 border-[1.5px] border-rose rounded-lg text-sm bg-cream-alt"
              />
              <button
                type="submit"
                className="bg-plum text-white px-5.5 py-3.5 rounded-xl font-semibold text-sm shadow-[0_4px_14px_rgba(90,47,69,0.25)]"
              >
                Subscribe
              </button>
            </form>
          </section>
        </Reveal>
      </main>
      <SiteFooter />
    </>
  );
}
