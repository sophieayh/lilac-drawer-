import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { slugify } from "@/lib/slugify";
import {
  getSidebarCategories,
  getFeatureProducts,
  getSaleOffProducts,
  getTodayDeals,
  getNewArrivals,
  getBestSellers,
  getDealsBlogPreview,
  formatPriceFixed,
  formatDate,
} from "@/db/queries";

const title = "Today's Deals — Tested Clothing Care & Accessories";
const description =
  "Live deals on garment steamers, cedar wood blocks, jewelry boxes, and reader-favorite accessories — all tested and ranked by Lilac Drawer.";

// ISR: revalidate DB-backed content every 60s instead of only at build/deploy time.
export const revalidate = 60;

export const metadata: Metadata = buildMetadata({ title, description, path: "/deals" });

export default async function DealsPage() {
  const [
    sidebarCategories,
    featureProducts,
    saleOff,
    todayDeals,
    newArrivals,
    bestSellers,
    latestBlogDeals,
  ] = await Promise.all([
    getSidebarCategories(),
    getFeatureProducts(),
    getSaleOffProducts(),
    getTodayDeals(),
    getNewArrivals(),
    getBestSellers(),
    getDealsBlogPreview(),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
          ],
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "Today's Deals",
          itemListElement: todayDeals.map((d, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Product",
              name: d.name,
              offers: {
                "@type": "Offer",
                priceCurrency: "USD",
                price: (d.priceCents / 100).toFixed(2),
                availability: d.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              },
            },
          })),
        }}
      />
      <SiteHeader />
      <main className="bg-cream text-purple min-h-screen">
        <div className="grid lg:grid-cols-[230px_1fr] gap-6 px-6 md:px-10 py-8 max-w-[1400px] mx-auto">
          {/* sidebar */}
          <aside className="hidden lg:block">
            <div className="bg-rose-light text-white px-5 py-4 font-heading text-[15px] font-bold rounded-t-[10px]">
              Vertical Menu
            </div>
            <div className="border border-border border-t-0 rounded-b-[10px] overflow-hidden mb-6">
              {sidebarCategories.map((s) => (
                <Link
                  key={s.id}
                  href={`/category/${s.slug || slugify(s.label)}`}
                  className="block px-5 py-3 text-[13.5px] text-purple border-b border-border last:border-b-0 hover:bg-mauve-50 hover:text-rose transition-colors"
                >
                  {s.label}
                </Link>
              ))}
            </div>

            <h3 className="font-heading text-base text-purple mb-3.5">Feature Products</h3>
            {featureProducts.map((fp) => (
              <Link key={fp.id} href={`/deals/${fp.slug}`} className="flex gap-3 py-2.5 border-b border-border items-center card-hover group block">
                <ImageSlot label={fp.imageLabel} imageUrl={fp.imageUrl} className="w-12 h-12 shrink-0" shape="rounded" radius={8} tone="mauve" />
                <div>
                  <div className="text-xs font-medium leading-snug group-hover:text-rose-light transition-colors">{fp.name}</div>
                  <div className="text-xs text-rose-light font-bold mt-0.5">{formatPriceFixed(fp.priceCents)}</div>
                </div>
              </Link>
            ))}

            <h3 className="font-heading text-base text-purple mt-6 mb-3.5">Sale Off</h3>
            {saleOff.map((so) => (
              <Link key={so.id} href={`/deals/${so.slug}`} className="flex gap-3 py-2.5 border-b border-border items-center card-hover group block">
                <ImageSlot label={so.imageLabel} imageUrl={so.imageUrl} className="w-12 h-12 shrink-0" shape="rounded" radius={8} tone="pink" />
                <div>
                  <div className="text-xs font-medium leading-snug group-hover:text-rose-light transition-colors">{so.name}</div>
                  <div className="text-xs text-rose-light font-bold mt-0.5">
                    {formatPriceFixed(so.priceCents)}{" "}
                    {so.compareAtPriceCents ? (
                      <span className="line-through text-lilac/50">{formatPriceFixed(so.compareAtPriceCents)}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ))}
          </aside>

          <div>
            {/* hero banner */}
            <div className="flex items-center bg-mauve-50 rounded-2xl px-6 md:px-10 py-8 mb-6 gap-6 flex-wrap">
              <div className="flex-1 min-w-[240px]">
                <h1 className="font-script text-[44px] text-rose-light mb-2.5">Steamer Season</h1>
                <p className="text-sm text-tan-dark max-w-[320px] mb-4.5">
                  Everything you need to keep clothes fresh, tested and ranked this month.
                </p>
                <Link href="#today-deals" className="bg-purple text-white px-6 py-2.5 rounded-full text-[13.5px] font-semibold">
                  Shop Now →
                </Link>
              </div>
              <ImageSlot label="Steamer season hero photo" className="w-[280px] h-[200px]" shape="rounded" radius={16} tone="pink" />
            </div>

            {/* feature strip */}
            <div className="grid sm:grid-cols-3 gap-4 mb-7">
              {[
                { label: "Care Basics", tone: "mauve" as const },
                { label: "Storage", tone: "pink" as const },
                { label: "Accessories", tone: "purple" as const },
              ].map((f) => (
                <div key={f.label} className="relative rounded-xl overflow-hidden">
                  <ImageSlot label={`${f.label} category photo`} className="w-full h-[130px]" tone={f.tone} />
                  <div className="absolute inset-0 bg-purple-deep/35 flex items-center justify-center">
                    <span className="text-white font-heading text-[15px] font-bold tracking-wide uppercase">
                      {f.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* today's deals */}
            <div id="today-deals" className="border-[1.5px] border-rose-light rounded-2xl p-6 mb-7 scroll-mt-6">
              <h2 className="text-center font-heading text-xl text-purple mb-5">Today Deals</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {todayDeals.map((t) => (
                  <Link key={t.id} href={`/deals/${t.slug}`} className="card-hover block group">
                    <div className="relative">
                      <span className="absolute top-1.5 left-1.5 bg-lilac-deep text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
                        NEW
                      </span>
                      <ImageSlot label={t.imageLabel} imageUrl={t.imageUrl} className="w-full h-[110px]" shape="rounded" radius={10} tone="mauve" />
                    </div>
                    <div className="text-[12.5px] font-semibold mt-2.5 leading-snug group-hover:text-rose-light transition-colors">{t.name}</div>
                    <div className="text-[12.5px] mt-1">
                      <span className="text-rose-light font-bold">{formatPriceFixed(t.priceCents)}</span>{" "}
                      {t.compareAtPriceCents ? (
                        <span className="text-lilac/50 line-through">{formatPriceFixed(t.compareAtPriceCents)}</span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* new arrivals */}
            <h2 className="font-heading text-xl text-purple mb-4">New Arrivals</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7 items-stretch">
              <div className="relative rounded-xl overflow-hidden">
                <ImageSlot label="New arrivals promo photo" className="w-full h-full min-h-[160px]" tone="pink" />
                <div className="absolute top-2.5 left-2.5 bg-white text-rose-light font-script text-[22px] px-3 py-1.5 rounded-lg">
                  Only $29
                </div>
              </div>
              {newArrivals.map((a) => (
                <Link key={a.id} href={`/deals/${a.slug}`} className="card-hover block group">
                  <div className="relative">
                    <span className="absolute top-1.5 left-1.5 bg-lilac-deep text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
                      NEW
                    </span>
                    <ImageSlot label={a.imageLabel} imageUrl={a.imageUrl} className="w-full h-[130px]" shape="rounded" radius={10} tone="mauve" />
                  </div>
                  <div className="text-[12.5px] font-semibold mt-2 group-hover:text-rose-light transition-colors">{a.name}</div>
                  <div className="text-[12.5px] text-rose-light font-bold mt-1">{formatPriceFixed(a.priceCents)}</div>
                </Link>
              ))}
              <div className="bg-gradient-to-br from-pink-200 to-lilac-deep rounded-xl flex flex-col items-center justify-center text-center p-5 text-white">
                <div className="font-heading text-[17px] font-bold mb-2">Buy 3 Get 1 Free</div>
                <div className="text-xs mb-3.5">Buy 3 of the same product</div>
                <Link href="#today-deals" className="bg-white text-purple px-4.5 py-2 rounded-full text-[12.5px] font-bold">
                  Shop Now
                </Link>
              </div>
            </div>

            {/* best sellers */}
            <h2 className="font-heading text-xl text-purple mb-4">Best Sellers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-[#e8f0e4] to-[#c9dbb8] rounded-xl flex flex-col items-center justify-center text-center p-5">
                <div className="font-script text-[28px] text-sage mb-1.5">Save 15%</div>
                <div className="text-xs text-[#4a6a3a]">From $19.90</div>
              </div>
              {bestSellers.map((b) => (
                <Link key={b.id} href={`/deals/${b.slug}`} className="card-hover block group">
                  <div className="relative">
                    <span className="absolute top-1.5 left-1.5 bg-lilac-deep text-white text-[10px] font-bold px-2 py-0.5 rounded z-10">
                      NEW
                    </span>
                    <ImageSlot label={b.imageLabel} imageUrl={b.imageUrl} className="w-full h-[130px]" shape="rounded" radius={10} tone="mauve" />
                  </div>
                  <div className="text-[12.5px] font-semibold mt-2 group-hover:text-rose-light transition-colors">{b.name}</div>
                  <div className="text-[12.5px] text-rose-light font-bold mt-1">{formatPriceFixed(b.priceCents)}</div>
                </Link>
              ))}
            </div>

            {/* latest blog */}
            <h2 className="font-heading text-xl text-purple mt-7 mb-4">Latest Blog</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {latestBlogDeals.map((lb) => (
                <Link key={lb.id} href={`/blog/${lb.slug}`} className="card-hover">
                  <ImageSlot label={lb.imageLabel} imageUrl={lb.imageUrl} className="w-full h-[140px]" shape="rounded" radius={10} tone="mauve" />
                  <div className="text-[13.5px] font-semibold mt-2.5 leading-snug">{lb.title}</div>
                  <div className="text-[11px] text-gold mt-1.5">📅 {formatDate(lb.publishedAt)}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* footer */}
        <footer className="bg-footer text-lilac/70 px-6 md:px-10 pt-9 pb-5">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1400px] mx-auto mb-6">
            <div>
              <div className="font-script text-[28px] text-pink-200 mb-2.5">Lilac Drawer</div>
              <p className="text-xs leading-relaxed text-lilac/60">
                Honest reviews and buying guides for clothing care, accessories, and more.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide uppercase text-pink-200 mb-3">
                Information
              </div>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <Link href="/deals" className="text-lilac/70">
                  Specials
                </Link>
                <Link href="/deals" className="text-lilac/70">
                  New products
                </Link>
                <Link href="/deals" className="text-lilac/70">
                  Best sellers
                </Link>
                <Link href="/explore" className="text-lilac/70">
                  Explore
                </Link>
                <Link href="/community" className="text-lilac/70">
                  Community
                </Link>
                <Link href="/profile" className="text-lilac/70">
                  Profile
                </Link>
                <Link href="/fashion-collage" className="text-lilac/70">
                  Fashion Collage
                </Link>
              </div>
            </div>
            <div>
              <div className="text-xs font-bold tracking-wide uppercase text-pink-200 mb-3">
                Newsletter
              </div>
              <form className="flex gap-2">
                <label htmlFor="deals-newsletter" className="sr-only">
                  Email address
                </label>
                <input
                  id="deals-newsletter"
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 border-none rounded-md px-3 py-2.5 text-[12.5px]"
                />
                <button type="submit" className="bg-rose-light text-white border-none rounded-md px-3.5 py-2.5 font-bold">
                  ✉
                </button>
              </form>
            </div>
          </div>
          <div className="text-center text-[11.5px] text-lilac/50 pt-4 border-t border-white/10">
            Copyright © {new Date().getFullYear()} {siteConfig.name}. As an affiliate, we earn from
            qualifying purchases.
          </div>
        </footer>
      </main>
    </>
  );
}
