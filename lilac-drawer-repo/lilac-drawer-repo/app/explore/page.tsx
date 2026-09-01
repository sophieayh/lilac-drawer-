import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import { exploreNavItems } from "@/lib/data";
import { auth } from "@/lib/auth";
import {
  getExploreCategories,
  getExploreDeals,
  getExploreRecommended,
  getSavedPicks,
  getSuggestedProducts,
  formatPrice,
} from "@/db/queries";

// This page reflects the viewer's own session, so it's rendered per-request
// rather than cached with ISR.
export const metadata: Metadata = {
  title: "Explore",
  description: "Browse personalized picks, deals, and categories.",
  robots: { index: false, follow: true },
};

export default async function ExplorePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const [exploreCategories, exploreDeals, exploreRecommended, exploreSaved, exploreSuggestions] =
    await Promise.all([
      getExploreCategories(),
      getExploreDeals(),
      getExploreRecommended(),
      getSavedPicks(),
      getSuggestedProducts(),
    ]);

  return (
    <>
      <SiteHeader />
    <div className="bg-cream text-purple-deep min-h-screen grid lg:grid-cols-[230px_1fr_320px]">
      {/* sidebar */}
      <aside className="hidden lg:flex border-r border-border p-6 flex-col gap-6">
        <div className="flex items-center gap-2.5 px-2">
          <div className="w-8 h-8 rounded-[9px] bg-lilac flex items-center justify-center text-white font-heading font-bold">
            L
          </div>
          <div className="font-heading text-[19px] text-purple-deep">Lilac Drawer</div>
        </div>
        <nav className="flex flex-col gap-1">
          {exploreNavItems.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-full text-[14.5px] font-medium ${
                i === 0 ? "bg-lilac text-white" : "text-purple-deep hover:bg-mauve-50"
              }`}
            >
              <span className="w-4.5 text-center" aria-hidden="true">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {"badge" in item && item.badge ? (
                <span className="bg-rose text-white text-[10.5px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="mt-auto bg-gradient-to-br from-lilac to-rose rounded-2xl p-4.5 text-white">
          <div className="font-heading text-base mb-1">Weekly Pick</div>
          <div className="text-[12.5px] opacity-90 mb-3.5 leading-snug">
            One tested product, straight to your inbox.
          </div>
          <Link href="/#subscribe" className="inline-block bg-white text-rose text-[12.5px] font-bold px-3.5 py-2 rounded-full">
            Subscribe
          </Link>
        </div>
      </aside>

      {/* main */}
      <main className="px-4 md:px-8 py-6">
        <div className="flex items-center gap-5 mb-7 flex-wrap">
          <form role="search" className="flex-1 min-w-[200px] flex items-center gap-2.5 bg-mauve-50 rounded-full px-4.5 py-2.5">
            <label htmlFor="explore-search" className="sr-only">
              Search products, guides and more
            </label>
            <svg width="16" height="16" viewBox="0 0 256 256" fill="#b89a7a" aria-hidden="true">
              <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
            </svg>
            <input id="explore-search" type="search" placeholder="Search for products, guides and more..." className="border-none bg-transparent outline-none text-sm flex-1" />
          </form>
          <span className="text-xl text-tan" aria-hidden="true">♡</span>
          <span className="text-xl text-tan relative" aria-hidden="true">
            🔔<span className="absolute -top-1 -right-2 bg-rose text-white text-[9px] w-[15px] h-[15px] rounded-full flex items-center justify-center">3</span>
          </span>
          <div className="flex items-center gap-2.5">
            <ImageSlot label="Your avatar" className="w-8.5 h-8.5" shape="circle" tone="purple" />
            {session?.user ? (
              <span className="text-sm font-semibold">{session.user.name}</span>
            ) : (
              <Link href="/login" className="text-sm font-semibold text-rose">
                Log in
              </Link>
            )}
          </div>
        </div>

        {/* hero */}
        <div className="relative rounded-[20px] overflow-hidden bg-gradient-to-br from-mauve-100 to-pink-100 px-6 md:px-10 py-9 mb-6">
          <span className="inline-block bg-white text-rose text-[11px] font-bold uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-4">
            New Collection
          </span>
          <h1 className="font-heading text-[32px] leading-tight text-purple-deep mb-2 max-w-[380px]">
            Find Your Style, Love Your Look
          </h1>
          <p className="text-sm text-tan-dark max-w-[340px] mb-5">
            Discover the season&apos;s best-tested trends in fashion, care, and accessories.
          </p>
          <Link href="/deals" className="inline-block bg-purple-deep text-white text-sm font-semibold px-6 py-3 rounded-full">
            Shop Now →
          </Link>
          <ImageSlot label="Lifestyle photo" className="hidden md:block absolute right-0 top-0 w-[280px] h-full" tone="purple" />
        </div>

        {/* categories */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5 mb-6">
          {exploreCategories.map((c) => (
            <Link key={c.id} href="/deals" className="flex flex-col items-center gap-2.5 bg-cream-alt border border-border rounded-2xl py-4.5 px-2">
              <span className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: c.colorHex ?? undefined }} aria-hidden="true">
                {c.icon}
              </span>
              <span className="text-[12.5px] font-semibold text-purple-deep">{c.label}</span>
            </Link>
          ))}
        </div>

        {/* promo strip */}
        <div className="grid sm:grid-cols-3 gap-3.5 mb-8">
          <div className="bg-pink-100 rounded-2xl p-4.5">
            <div className="text-xs font-bold text-rose uppercase tracking-wide">Flash Sale</div>
            <div className="font-heading text-base text-purple-deep my-1.5">Limited-time deals, up to 40% off</div>
            <Link href="/deals" className="text-[13px] font-semibold text-purple-deep">Shop now →</Link>
          </div>
          <div className="bg-[#e8f0e4] rounded-2xl p-4.5">
            <div className="text-xs font-bold text-sage uppercase tracking-wide">Free Shipping</div>
            <div className="font-heading text-base text-purple-deep my-1.5">On orders over $50</div>
            <Link href="/deals" className="text-[13px] font-semibold text-purple-deep">Shop now →</Link>
          </div>
          <div className="bg-mauve-100 rounded-2xl p-4.5">
            <div className="text-xs font-bold text-gold uppercase tracking-wide">New Arrivals</div>
            <div className="font-heading text-base text-purple-deep my-1.5">Check the newest reviewed picks</div>
            <Link href="/deals" className="text-[13px] font-semibold text-purple-deep">Shop now →</Link>
          </div>
        </div>

        {/* best deals */}
        <div className="flex justify-between items-baseline mb-4.5">
          <h2 className="font-heading text-[22px] text-purple-deep">Best Deals for You</h2>
          <Link href="/deals" className="text-[13.5px] font-semibold">View All →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4.5 mb-8">
          {exploreDeals.map((d) => (
            <div key={d.id} className="bg-cream-alt border border-border rounded-2xl p-3.5 card-hover">
              <div className="relative mb-3">
                <span className="absolute top-2 left-2 bg-rose text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
                  -{d.discountPercent}%
                </span>
                <ImageSlot label={d.imageLabel} imageUrl={d.imageUrl} className="w-full h-[140px]" shape="rounded" radius={12} tone="mauve" />
              </div>
              <div className="text-sm font-semibold text-purple-deep">{d.name}</div>
              <div className="text-xs text-tan mb-2">{d.subtitle}</div>
              <div className="flex items-baseline gap-2">
                <span className="font-heading font-bold text-base text-rose">{formatPrice(d.priceCents)}</span>
                {d.compareAtPriceCents ? (
                  <span className="text-xs text-lilac/60 line-through">{formatPrice(d.compareAtPriceCents)}</span>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* recommended */}
        <div className="flex justify-between items-baseline mb-4.5">
          <h2 className="font-heading text-[22px] text-purple-deep">Recommended for You</h2>
          <Link href="/deals" className="text-[13.5px] font-semibold">View All →</Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
          {exploreRecommended.map((r) => (
            <div key={r.id} className="bg-cream-alt border border-border rounded-2xl p-3.5 card-hover">
              <ImageSlot label={r.imageLabel} imageUrl={r.imageUrl} className="w-full h-[140px] mb-3" shape="rounded" radius={12} tone="pink" />
              <div className="text-sm font-semibold text-purple-deep">{r.name}</div>
              <div className="text-xs text-tan mb-2">{r.subtitle}</div>
              <div className="font-heading font-bold text-base text-rose">{formatPrice(r.priceCents)}</div>
            </div>
          ))}
        </div>
      </main>

      {/* right panel */}
      <aside className="hidden xl:block border-l border-border p-5">
        <div className="flex justify-between items-center mb-4.5">
          <h3 className="font-heading text-[17px] text-purple-deep">Saved Picks ({exploreSaved.length})</h3>
          <span className="text-tan text-base" aria-hidden="true">×</span>
        </div>
        {exploreSaved.map((s) => (
          <div key={s.id} className="flex gap-3 py-3 border-b border-border">
            <ImageSlot label={s.imageLabel} imageUrl={s.imageUrl} className="w-13 h-13 shrink-0" shape="rounded" radius={10} tone="mauve" />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-purple-deep leading-snug">{s.name}</div>
              <div className="text-[11.5px] text-tan mt-0.5">{s.subtitle}</div>
              <div className="font-heading font-bold text-[13.5px] text-rose mt-1">{formatPrice(s.priceCents)}</div>
            </div>
          </div>
        ))}

        <div className="mt-5 pt-4">
          <h4 className="font-heading text-sm text-purple-deep mb-3">You Might Also Like</h4>
          {exploreSuggestions.map((sg) => (
            <div key={sg.id} className="flex gap-3 items-center py-2">
              <ImageSlot label={sg.imageLabel} imageUrl={sg.imageUrl} className="w-10 h-10 shrink-0" shape="rounded" radius={8} tone="pink" />
              <div className="flex-1 text-[12.5px] font-medium text-purple-deep">{sg.name}</div>
              <span className="font-heading font-bold text-[12.5px] text-rose">{formatPrice(sg.priceCents)}</span>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gradient-to-br from-mauve-100 to-pink-100 rounded-2xl p-4.5">
          <div className="font-heading text-[15px] text-plum mb-1.5">Join the Club</div>
          <div className="text-xs text-plum/80 mb-3.5 leading-snug">
            Early access to guides and exclusive picks.
          </div>
          <Link href="/#subscribe" className="inline-block bg-plum text-white text-[12.5px] font-bold px-4 py-2.5 rounded-full">
            Join Now
          </Link>
        </div>
      </aside>
    </div>
    </>
  );
}
