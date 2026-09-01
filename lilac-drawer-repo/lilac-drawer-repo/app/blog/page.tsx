import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import {
  getRecentBlogPosts,
  getSideStories,
  getPostsByCategory,
  getLatestPosts,
  getFeaturedPost,
  formatDate,
} from "@/db/queries";

const title = "Blog — Reviews, Care Guides & Wardrobe Tips";
const description =
  "Fresh reviews, care routines, and buying guides for clothing care, wardrobe storage, and accessories — updated weekly by Lilac Drawer.";

// ISR: revalidate DB-backed content every 60s instead of only at build/deploy time.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({ title, description, path: "/blog" });

const primaryTopics = ["Reviews", "Care", "Guides"];

export default async function BlogPage() {
  // featuredPost is fetched first so the CARE grid below can exclude it —
  // otherwise the same article (the most recent CARE post) would appear
  // twice on this page: once as the featured hero, once again as the
  // first card in the CARE section.
  const featuredPost = await getFeaturedPost();

  const [recentList, sideStories, blogReviews, careArticles, latestPosts, guide] = await Promise.all([
    getRecentBlogPosts(),
    getSideStories(),
    getPostsByCategory("REVIEWS", 4),
    getPostsByCategory("CARE", 4, featuredPost?.slug),
    getLatestPosts(4),
    getPostsByCategory("GUIDES", 1),
  ]);

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
      <main className="bg-cream text-purple-deep min-h-screen">
        <div className="flex justify-between items-center px-6 md:px-12 py-3.5 max-w-[1200px] mx-auto text-[12.5px] text-purple bg-sand">
          <span>Honest reviews since 2023</span>
          <Link
            href="#subscribe"
            className="border-[1.5px] border-lilac text-purple font-bold px-4.5 py-1.5 rounded-full text-xs uppercase tracking-wide"
          >
            Subscribe
          </Link>
        </div>

        <div className="text-center px-6 pb-5 border-b-2 border-lilac max-w-[1200px] mx-auto">
          <h1 className="font-heading text-4xl md:text-[48px] font-bold tracking-tight text-rose-light">
            Lilac <span className="text-purple">Drawer</span>
          </h1>
          <div className="text-[11.5px] tracking-widest uppercase text-gold mt-1.5">
            Honest Reviews &amp; Buying Guides. Since 2023
          </div>
        </div>

        <nav
          aria-label="Blog categories"
          className="hidden md:flex justify-center gap-9 px-6 py-4 border-b border-border text-[13px] font-bold uppercase tracking-wide text-purple-deep max-w-[1200px] mx-auto"
        >
          {primaryTopics.map((t) => (
            <Link key={t} href={`#${t.toLowerCase()}`} className="text-purple-deep hover:text-rose">
              {t}
            </Link>
          ))}
        </nav>

        <section className="px-6 md:px-12 pt-2 pb-14 max-w-[1100px] mx-auto">
          <div className="border-2 border-purple-deep p-8 md:p-14 bg-cream-alt">
            <h2 className="font-heading text-4xl md:text-[64px] font-bold text-center text-purple-deep tracking-tight">
              The Yearly Wrap
            </h2>
            <div className="text-center text-[13px] tracking-[0.2em] uppercase text-rose font-bold my-1.5 mb-6">
              2026 Shopping Wrapped
            </div>
            <div className="border-t-2 border-b border-purple-deep h-[3px] mb-6" />
            <div className="grid md:grid-cols-3 border-t border-b border-purple-deep">
              <div className="p-7 md:border-r border-purple-deep text-center">
                <div className="text-[11px] tracking-wide uppercase font-bold underline mb-2.5">
                  My Reviewer Age
                </div>
                <div className="font-heading text-[76px] font-bold text-purple-deep leading-none">3</div>
                <p className="text-xs leading-relaxed text-tan-dark mt-2.5">
                  Three years testing products so readers don&apos;t have to guess.
                </p>
              </div>
              <div className="p-7 md:border-r border-purple-deep text-center">
                <div className="text-sm font-semibold text-purple-deep mb-3">
                  Most Reviewed Product
                </div>
                <ImageSlot label="Garment steamer — most reviewed product" className="w-full h-[260px]" tone="mauve" />
                <p className="text-xs leading-relaxed text-tan-dark mt-2.5">
                  The garment steamer topped reader clicks all year, reviewed and updated four
                  times.
                </p>
              </div>
              <div className="p-7 text-center">
                <div className="text-[11px] tracking-wide uppercase font-bold underline mb-2.5">
                  Listening Report
                </div>
                <p className="text-xs leading-relaxed text-tan-dark mb-3">
                  Readers spent the most time this year on care guides, followed by top-10 lists
                  and jewelry storage.
                </p>
                <div className="font-heading text-sm font-bold text-purple-deep">Aug 2, 2026</div>
              </div>
            </div>
            <div className="grid md:grid-cols-2 border-b border-purple-deep">
              <div className="p-7 md:border-r border-purple-deep flex gap-5 items-center">
                <div className="w-[70px] h-[70px] rounded-full bg-purple-deep shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-[11px] tracking-wide uppercase font-bold mb-1">Top Pick 2026</div>
                  <div className="font-heading text-[15px] font-bold text-purple-deep">
                    Steamfast SF-717
                  </div>
                  <div className="text-[11.5px] text-tan mt-0.5">4,120 clicks</div>
                </div>
              </div>
              <div className="p-7">
                <div className="text-[11px] tracking-wide uppercase font-bold underline mb-2.5">
                  Top Categories This Year
                </div>
                <div className="font-heading text-[15px] font-bold text-purple-deep leading-loose">
                  CLOTHING CARE<br />ACCESSORIES<br />WARDROBE STORAGE<br />JEWELRY &amp; WATCHES<br />BAGS
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 md:px-12 pt-2 pb-14 max-w-[1200px] mx-auto border-t border-border">
          <div className="flex justify-between items-center py-5 text-[11px] tracking-widest uppercase text-tan">
            <span>● Lilac Drawer</span>
            <span>Menu</span>
          </div>
          <div className="grid md:grid-cols-2 gap-10 items-center mb-10">
            <div>
              <h2 className="font-heading text-[34px] leading-tight mb-4 text-purple-deep">
                8 Days of Wardrobe Care, Done Right for You
              </h2>
              <p className="text-[14.5px] leading-relaxed text-tan-dark max-w-[400px]">
                A short daily routine that keeps clothes, jewelry, and accessories in shape
                without adding chores to your week.
              </p>
            </div>
            <ImageSlot label="Wardrobe care editorial photo" className="w-full h-[280px]" tone="mauve" />
          </div>

          <div className="flex justify-between items-baseline mb-5">
            <span className="text-[11.5px] font-bold tracking-wide uppercase text-rose">
              ● Latest Posts
            </span>
            <Link href="#recent-posts" className="text-xs font-bold tracking-wide uppercase">
              View All
            </Link>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {latestPosts.map((p, i) => (
              <Link key={p.id} href={`/blog/${p.slug}`} className="text-purple-deep card-hover">
                <ImageSlot label={p.imageLabel} imageUrl={p.imageUrl} className={`w-full ${i === 0 ? "h-[220px]" : "h-24"}`} tone={i % 2 === 0 ? "mauve" : "pink"} />
                <div className="font-heading text-[13.5px] font-bold leading-snug mt-2.5">
                  {p.title}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="recent-posts" className="grid lg:grid-cols-[220px_1.6fr_260px] gap-7 px-6 md:px-12 py-8 max-w-[1200px] mx-auto">
          <div className="flex flex-col gap-5 order-2 lg:order-1">
            {recentList.map((rl) => (
              <Link key={rl.id} href={`/blog/${rl.slug}`} className="flex gap-3 text-purple-deep card-hover">
                <ImageSlot label={rl.imageLabel} imageUrl={rl.imageUrl} className="w-14 h-14 shrink-0" tone="mauve" />
                <div>
                  <div className="font-heading text-[13.5px] font-bold leading-snug mb-2.5">
                    {rl.title}
                  </div>
                  <div className="text-[11.5px] text-tan leading-snug">{rl.excerpt}</div>
                </div>
              </Link>
            ))}
          </div>

          <article className="order-1 lg:order-2">
            {featuredPost && (
              <Link href={`/blog/${featuredPost.slug}`} className="block">
                <ImageSlot label={featuredPost.imageLabel} imageUrl={featuredPost.imageUrl} className="w-full h-[340px]" tone="mauve" />
                <div className="text-[11.5px] font-bold tracking-wide uppercase text-rose my-4">
                  {featuredPost.topicLabel ?? featuredPost.category}
                </div>
                <h2 className="font-heading text-3xl leading-tight mb-3 text-purple-deep">
                  {featuredPost.title}
                </h2>
                <p className="text-[15px] leading-relaxed text-tan-dark mb-2.5">{featuredPost.excerpt}</p>
                <div className="text-xs text-tan">
                  BY {featuredPost.author.toUpperCase()} · {formatDate(featuredPost.publishedAt).toUpperCase()}
                </div>
              </Link>
            )}
          </article>

          <div className="flex flex-col gap-6 order-3">
            {sideStories.map((ss) => (
              <Link key={ss.id} href={`/blog/${ss.slug}`} className="block text-purple-deep card-hover">
                <ImageSlot label={ss.imageLabel} imageUrl={ss.imageUrl} className="w-full h-[150px]" tone="pink" />
                <div className="font-heading text-[15px] font-bold leading-snug mt-2.5">
                  {ss.title}
                </div>
                <div className="text-xs text-tan mt-1.5 leading-snug">{ss.excerpt}</div>
              </Link>
            ))}
          </div>
        </section>

        <section id="reviews" className="px-6 md:px-12 pb-2 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-bold text-purple-deep tracking-tight">
              REVIEWS
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 pb-9 border-b border-border">
            {blogReviews.map((r) => (
              <Link key={r.id} href={`/blog/${r.slug}`} className="text-purple-deep card-hover">
                <ImageSlot label={r.imageLabel} imageUrl={r.imageUrl} className="w-full h-[150px]" tone="mauve" />
                <h3 className="font-heading text-base font-bold leading-snug my-3">{r.title}</h3>
                <p className="text-[13px] text-tan-dark leading-relaxed mb-2">{r.excerpt}</p>
                <div className="text-[11px] text-tan">
                  {formatDate(r.publishedAt).toUpperCase()} · {r.category}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="care" className="px-6 md:px-12 pt-9 pb-2 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-bold text-purple-deep tracking-tight">
              CARE
            </h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6 pb-9 border-b border-border">
            {careArticles.map((c) => (
              <Link key={c.id} href={`/blog/${c.slug}`} className="text-purple-deep card-hover">
                <ImageSlot label={c.imageLabel} imageUrl={c.imageUrl} className="w-full h-[150px]" tone="pink" />
                <h3 className="font-heading text-base font-bold leading-snug my-3">{c.title}</h3>
                <p className="text-[13px] text-tan-dark leading-relaxed mb-2">{c.excerpt}</p>
                <div className="text-[11px] text-tan">
                  {formatDate(c.publishedAt).toUpperCase()} · {c.category}
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section id="guides" className="px-6 md:px-12 pt-9 pb-14 max-w-[1200px] mx-auto scroll-mt-20">
          <div className="flex justify-between items-baseline border-b-2 border-purple-deep pb-2.5 mb-6">
            <h2 className="font-heading text-[34px] font-bold text-purple-deep tracking-tight">
              GUIDES
            </h2>
          </div>
          {guide[0] && (
            <Link href={`/blog/${guide[0].slug}`} className="grid md:grid-cols-2 gap-8 items-center text-purple-deep card-hover">
              <ImageSlot label={guide[0].imageLabel} imageUrl={guide[0].imageUrl} className="w-full h-[320px]" tone="mauve" />
              <div>
                <div className="text-[11.5px] font-bold tracking-wide uppercase text-rose mb-2.5">
                  Guide
                </div>
                <h3 className="font-heading text-[26px] leading-tight mb-3">{guide[0].title}</h3>
                <p className="text-[14.5px] leading-relaxed text-tan-dark mb-2.5">{guide[0].excerpt}</p>
                <div className="text-xs text-tan">
                  {formatDate(guide[0].publishedAt).toUpperCase()} · GUIDES
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
