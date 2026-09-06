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
  getDealsHeroPost,
  formatPriceFixed,
  calculateDiscountPercent,
  formatDate,
} from "@/db/queries";

const title = "Today's Deals — Tested Beauty & Lifestyle Essentials";
const description =
  "Live verified deals on tested beauty, skincare, and lifestyle essentials — all tested and ranked with authentic savings by Lilac Drawer.";

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
    heroPost,
  ] = await Promise.all([
    getSidebarCategories(),
    getFeatureProducts(),
    getSaleOffProducts(),
    getTodayDeals(),
    getNewArrivals(),
    getBestSellers(),
    getDealsBlogPreview(),
    getDealsHeroPost(),
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
            {featureProducts.map((fp) => {
              const discount = fp.discountPercent ?? calculateDiscountPercent(fp.priceCents, fp.compareAtPriceCents);
              const savedCents = fp.compareAtPriceCents && fp.compareAtPriceCents > fp.priceCents ? fp.compareAtPriceCents - fp.priceCents : 0;
              return (
                <Link key={fp.id} href={`/deals/${fp.slug}`} className="flex gap-3 py-2.5 border-b border-border items-center card-hover group block">
                  <ImageSlot label={fp.imageLabel} imageUrl={fp.imageUrl} className="w-12 h-12 shrink-0" shape="rounded" radius={8} tone="mauve" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-snug truncate group-hover:text-rose-light transition-colors">{fp.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-rose-light font-bold">{formatPriceFixed(fp.priceCents)}</span>
                      {fp.compareAtPriceCents ? (
                        <span className="line-through text-lilac/50 text-[11px]">{formatPriceFixed(fp.compareAtPriceCents)}</span>
                      ) : null}
                      {discount ? (
                        <span className="text-[10px] font-bold text-rose-light bg-rose-light/10 px-1.5 py-0.5 rounded">-{discount}%</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}

            <h3 className="font-heading text-base text-purple mt-6 mb-3.5">Sale Off</h3>
            {saleOff.map((so) => {
              const discount = so.discountPercent ?? calculateDiscountPercent(so.priceCents, so.compareAtPriceCents);
              return (
                <Link key={so.id} href={`/deals/${so.slug}`} className="flex gap-3 py-2.5 border-b border-border items-center card-hover group block">
                  <ImageSlot label={so.imageLabel} imageUrl={so.imageUrl} className="w-12 h-12 shrink-0" shape="rounded" radius={8} tone="pink" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium leading-snug truncate group-hover:text-rose-light transition-colors">{so.name}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-rose-light font-bold">{formatPriceFixed(so.priceCents)}</span>
                      {so.compareAtPriceCents ? (
                        <span className="line-through text-lilac/50 text-[11px]">{formatPriceFixed(so.compareAtPriceCents)}</span>
                      ) : null}
                      {discount ? (
                        <span className="text-[10px] font-bold text-rose-light bg-rose-light/10 px-1.5 py-0.5 rounded">-{discount}%</span>
                      ) : null}
                    </div>
                  </div>
                </Link>
              );
            })}
          </aside>

          <div>
            {/* hero banner: dynamic featured deal article */}
            {heroPost ? (
              <div className="bg-mauve-50 rounded-2xl p-6 md:p-8 mb-6 border border-border flex flex-col md:flex-row items-center gap-6 justify-between">
                <div className="flex-1 min-w-[240px]">
                  <div className="inline-flex items-center gap-1.5 bg-rose-light/15 text-rose-light text-[11px] font-bold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                    <span>Featured Deal Guide</span>
                  </div>
                  <Link href={`/blog/${heroPost.slug}`} className="group block">
                    <h1 className="font-heading text-2xl md:text-3xl text-purple-deep font-bold mb-2.5 leading-snug group-hover:text-rose-light transition-colors">
                      {heroPost.title}
                    </h1>
                  </Link>
                  <p className="text-xs md:text-sm text-tan-dark max-w-[460px] mb-4.5 leading-relaxed line-clamp-3">
                    {heroPost.excerpt}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      href={`/blog/${heroPost.slug}`}
                      className="bg-purple hover:bg-purple-deep text-white px-5 py-2.5 rounded-full text-[13px] font-semibold transition-colors inline-flex items-center gap-1.5 shadow-xs"
                    >
                      <span>Read Guide & Shop Deals</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
                <Link href={`/blog/${heroPost.slug}`} className="shrink-0 w-full md:w-[280px] lg:w-[320px] block group overflow-hidden rounded-xl border border-border">
                  <ImageSlot
                    label={heroPost.imageLabel || heroPost.title}
                    imageUrl={heroPost.imageUrl}
                    className="w-full h-[180px] md:h-[190px] group-hover:scale-105 transition-transform duration-300"
                    shape="rounded"
                    radius={12}
                    tone="pink"
                  />
                </Link>
              </div>
            ) : null}

            {/* feature category strip: categories with real active discounts */}
            <div className="grid sm:grid-cols-3 gap-4 mb-7">
              {[
                {
                  label: "Makeup & Complexion",
                  sublabel: "Foundations, Powders & Concealers",
                  discount: "Up to 21% OFF",
                  href: "/category/beauty-makeup",
                  imageLabel: "Makeup and cosmetics flatlay",
                  imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&auto=format&fit=crop&q=80",
                  tone: "mauve" as const,
                },
                {
                  label: "Eye & Lip Care",
                  sublabel: "Volumizing Mascaras & Balms",
                  discount: "Up to 17% OFF",
                  href: "/category/beauty-makeup",
                  imageLabel: "Lip balms and eye makeup beauty products",
                  imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&auto=format&fit=crop&q=80",
                  tone: "pink" as const,
                },
                {
                  label: "Brushes & Tools",
                  sublabel: "Blending Sponges & 5-Piece Sets",
                  discount: "Up to 20% OFF",
                  href: "/category/beauty-makeup",
                  imageLabel: "Professional makeup brushes and beauty sponges",
                  imageUrl: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&auto=format&fit=crop&q=80",
                  tone: "purple" as const,
                },
              ].map((cat) => (
                <Link
                  key={cat.label}
                  href={cat.href}
                  className="relative rounded-xl overflow-hidden group block border border-border shadow-xs hover:border-rose-light transition-colors"
                >
                  <div className="relative h-[130px] w-full overflow-hidden">
                    <ImageSlot
                      label={cat.imageLabel}
                      imageUrl={cat.imageUrl}
                      className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                      tone={cat.tone}
                    />
                    <div className="absolute inset-0 bg-purple-deep/45 group-hover:bg-purple-deep/35 transition-colors flex flex-col justify-end p-3.5">
                      <span className="inline-block bg-rose-light text-white text-[10px] font-bold px-2 py-0.5 rounded w-fit mb-1 shadow-xs">
                        {cat.discount}
                      </span>
                      <span className="text-white font-heading text-[14px] font-bold tracking-wide">
                        {cat.label}
                      </span>
                      <span className="text-white/80 text-[11px] truncate">
                        {cat.sublabel}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* today's deals */}
            <div id="today-deals" className="border-[1.5px] border-rose-light rounded-2xl p-6 mb-7 scroll-mt-6">
              <h2 className="text-center font-heading text-xl text-purple mb-5">Today Deals</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {todayDeals.map((t) => {
                  const discount = t.discountPercent ?? calculateDiscountPercent(t.priceCents, t.compareAtPriceCents);
                  const savedCents = t.compareAtPriceCents && t.compareAtPriceCents > t.priceCents ? t.compareAtPriceCents - t.priceCents : 0;
                  return (
                    <Link key={t.id} href={`/deals/${t.slug}`} className="card-hover block group">
                      <div className="relative">
                        {discount ? (
                          <span className="absolute top-2 left-2 bg-rose-light text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md z-10 shadow-xs">
                            -{discount}% OFF
                          </span>
                        ) : null}
                        <ImageSlot label={t.imageLabel} imageUrl={t.imageUrl} className="w-full h-[120px]" shape="rounded" radius={10} tone="mauve" />
                      </div>
                      <div className="text-[12.5px] font-semibold mt-2.5 leading-snug line-clamp-2 group-hover:text-rose-light transition-colors">{t.name}</div>
                      <div className="text-[12.5px] mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-rose-light font-bold">{formatPriceFixed(t.priceCents)}</span>
                        {t.compareAtPriceCents ? (
                          <span className="text-lilac/50 line-through text-xs">{formatPriceFixed(t.compareAtPriceCents)}</span>
                        ) : null}
                      </div>
                      {savedCents > 0 ? (
                        <div className="text-[11px] text-sage font-medium mt-0.5">
                          Save {formatPriceFixed(savedCents)}
                        </div>
                      ) : null}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* new arrivals */}
            <h2 className="font-heading text-xl text-purple mb-4">New Arrivals</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-7 items-stretch">
              <div className="relative rounded-xl overflow-hidden bg-[#fae8ee] border border-pink-200 flex flex-col justify-center items-center p-5 text-center">
                <div className="text-rose-light font-script text-[26px] leading-tight mb-1">
                  Save up to 21%
                </div>
                <div className="text-xs text-tan-dark font-medium">Authentic Deals</div>
              </div>
              {newArrivals.map((a) => {
                const discount = a.discountPercent ?? calculateDiscountPercent(a.priceCents, a.compareAtPriceCents);
                const savedCents = a.compareAtPriceCents && a.compareAtPriceCents > a.priceCents ? a.compareAtPriceCents - a.priceCents : 0;
                return (
                  <Link key={a.id} href={`/deals/${a.slug}`} className="card-hover block group">
                    <div className="relative">
                      {discount ? (
                        <span className="absolute top-2 left-2 bg-rose-light text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md z-10 shadow-xs">
                          -{discount}% OFF
                        </span>
                      ) : null}
                      <ImageSlot label={a.imageLabel} imageUrl={a.imageUrl} className="w-full h-[130px]" shape="rounded" radius={10} tone="mauve" />
                    </div>
                    <div className="text-[12.5px] font-semibold mt-2 line-clamp-2 group-hover:text-rose-light transition-colors">{a.name}</div>
                    <div className="text-[12.5px] mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-rose-light font-bold">{formatPriceFixed(a.priceCents)}</span>
                      {a.compareAtPriceCents ? (
                        <span className="text-lilac/50 line-through text-xs">{formatPriceFixed(a.compareAtPriceCents)}</span>
                      ) : null}
                    </div>
                    {savedCents > 0 ? (
                      <div className="text-[11px] text-sage font-medium mt-0.5">
                        Save {formatPriceFixed(savedCents)}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
              <div className="bg-purple-deep rounded-xl flex flex-col items-center justify-center text-center p-5 text-white">
                <div className="font-heading text-[16px] font-bold mb-1">Editor Curated</div>
                <div className="text-xs text-white/80 mb-3.5">Tested and ranked by our beauty team</div>
                <Link href="#today-deals" className="bg-white text-purple hover:bg-cream px-4.5 py-2 rounded-full text-[12.5px] font-bold transition-colors">
                  Shop Deals
                </Link>
              </div>
            </div>

            {/* best sellers */}
            <h2 className="font-heading text-xl text-purple mb-4">Best Sellers</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#eef4ea] border border-[#c9dbb8] rounded-xl flex flex-col items-center justify-center text-center p-5">
                <div className="font-script text-[26px] text-sage mb-1">Top Rated Deals</div>
                <div className="text-xs text-[#4a6a3a] font-medium">Save up to 21% • From $8.00</div>
              </div>
              {bestSellers.map((b) => {
                const discount = b.discountPercent ?? calculateDiscountPercent(b.priceCents, b.compareAtPriceCents);
                const savedCents = b.compareAtPriceCents && b.compareAtPriceCents > b.priceCents ? b.compareAtPriceCents - b.priceCents : 0;
                return (
                  <Link key={b.id} href={`/deals/${b.slug}`} className="card-hover block group">
                    <div className="relative">
                      {discount ? (
                        <span className="absolute top-2 left-2 bg-rose-light text-white text-[11px] font-bold px-2.5 py-0.5 rounded-md z-10 shadow-xs">
                          -{discount}% OFF
                        </span>
                      ) : null}
                      <ImageSlot label={b.imageLabel} imageUrl={b.imageUrl} className="w-full h-[130px]" shape="rounded" radius={10} tone="mauve" />
                    </div>
                    <div className="text-[12.5px] font-semibold mt-2 line-clamp-2 group-hover:text-rose-light transition-colors">{b.name}</div>
                    <div className="text-[12.5px] mt-1.5 flex items-baseline gap-1.5">
                      <span className="text-rose-light font-bold">{formatPriceFixed(b.priceCents)}</span>
                      {b.compareAtPriceCents ? (
                        <span className="text-lilac/50 line-through text-xs">{formatPriceFixed(b.compareAtPriceCents)}</span>
                      ) : null}
                    </div>
                    {savedCents > 0 ? (
                      <div className="text-[11px] text-sage font-medium mt-0.5">
                        Save {formatPriceFixed(savedCents)}
                      </div>
                    ) : null}
                  </Link>
                );
              })}
            </div>

            {/* latest blog */}
            <h2 className="font-heading text-xl text-purple mt-7 mb-4">Latest Blog</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {latestBlogDeals.map((lb) => (
                <Link key={lb.id} href={`/blog/${lb.slug}`} className="card-hover">
                  <ImageSlot label={lb.imageLabel} imageUrl={lb.imageUrl} className="w-full h-[140px]" shape="rounded" radius={10} tone="mauve" />
                  <div className="text-[13.5px] font-semibold mt-2.5 leading-snug">{lb.title}</div>
                  <div className="text-[11px] text-gold mt-1.5">{formatDate(lb.publishedAt)}</div>
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
                <button type="submit" aria-label="Subscribe" className="bg-rose-light hover:bg-rose text-white border-none rounded-md px-3.5 py-2.5 font-bold transition-colors cursor-pointer flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                  </svg>
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
