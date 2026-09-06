import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import {
  getExploreCategories,
  getExploreDeals,
  getExploreRecommended,
  getSavedPicks,
  getSuggestedProducts,
  formatPrice,
} from "@/db/queries";
import { slugify } from "@/lib/slugify";
import { siteConfig, buildMetadata } from "@/lib/site";

export const revalidate = 60;

export const metadata: Metadata = buildMetadata({
  title: "Explore",
  description: "Browse personalized picks, deals, and categories on Lilac Drawer.",
  path: "/explore",
});

export default async function ExplorePage() {
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
      <div className="bg-cream text-purple-deep min-h-screen">
        <div className="max-w-[1400px] mx-auto px-4 md:px-8 py-8 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-8">
          {/* main */}
          <main className="flex flex-col gap-8 min-w-0">
            {/* hero */}
            <div className="relative rounded-[20px] overflow-hidden bg-mauve-50 border border-border px-6 md:px-10 py-9">
              <span className="inline-block bg-white text-rose text-[11px] font-bold uppercase tracking-wide px-3.5 py-1.5 rounded-full mb-4">
                New Collection
              </span>
              <h1 className="font-heading text-[32px] md:text-[38px] leading-tight text-purple-deep mb-2 max-w-[420px]">
                Find Your Style, Love Your Look
              </h1>
              <p className="text-sm text-tan-dark max-w-[360px] mb-5">
                Discover the season&apos;s best-tested trends in fashion, care, and accessories.
              </p>
              <Link
                href="/deals"
                className="inline-block bg-purple-deep text-white text-sm font-semibold px-6 py-3 rounded-full hover:bg-purple-deep/90 transition-colors"
              >
                Shop Now →
              </Link>
              <ImageSlot
                label="Lifestyle photo"
                className="hidden md:block absolute right-0 top-0 w-[280px] h-full"
                tone="purple"
              />
            </div>

            {/* categories */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3.5">
              {exploreCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug || slugify(c.label)}`}
                  className="flex flex-col items-center gap-2.5 bg-cream-alt border border-border rounded-2xl py-4.5 px-2 hover:bg-mauve-50 hover:border-lilac/50 transition-all"
                >
                  <span
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl"
                    style={{ background: c.colorHex ?? undefined }}
                    aria-hidden="true"
                  >
                    {c.icon}
                  </span>
                  <span className="text-[12.5px] font-semibold text-purple-deep text-center">{c.label}</span>
                </Link>
              ))}
            </div>

            {/* promo strip */}
            <div className="grid sm:grid-cols-3 gap-3.5">
              <div className="bg-pink-100 rounded-2xl p-4.5">
                <div className="text-xs font-bold text-rose uppercase tracking-wide">Flash Sale</div>
                <div className="font-heading text-base text-purple-deep my-1.5">Limited-time deals, up to 40% off</div>
                <Link href="/deals" className="text-[13px] font-semibold text-purple-deep hover:underline">
                  Shop now →
                </Link>
              </div>
              <div className="bg-[#e8f0e4] rounded-2xl p-4.5">
                <div className="text-xs font-bold text-sage uppercase tracking-wide">Free Shipping</div>
                <div className="font-heading text-base text-purple-deep my-1.5">On orders over $50</div>
                <Link href="/deals" className="text-[13px] font-semibold text-purple-deep hover:underline">
                  Shop now →
                </Link>
              </div>
              <div className="bg-mauve-100 rounded-2xl p-4.5">
                <div className="text-xs font-bold text-gold uppercase tracking-wide">New Arrivals</div>
                <div className="font-heading text-base text-purple-deep my-1.5">Check the newest reviewed picks</div>
                <Link href="/deals" className="text-[13px] font-semibold text-purple-deep hover:underline">
                  Shop now →
                </Link>
              </div>
            </div>

            {/* best deals */}
            <div>
              <div className="flex justify-between items-baseline mb-4.5">
                <h2 className="font-heading text-[22px] text-purple-deep">Best Deals for You</h2>
                <Link href="/deals" className="text-[13.5px] font-semibold hover:text-rose transition-colors">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {exploreDeals.map((d) => (
                  <Link
                    key={d.id}
                    href={`/deals/${d.slug}`}
                    className="bg-cream-alt border border-border rounded-2xl p-3.5 card-hover block group"
                  >
                    <div className="relative mb-3">
                      <span className="absolute top-2 left-2 bg-rose text-white text-[11px] font-bold px-2 py-0.5 rounded-full z-10">
                        -{d.discountPercent}%
                      </span>
                      <ImageSlot
                        label={d.imageLabel}
                        imageUrl={d.imageUrl}
                        className="w-full h-[140px]"
                        shape="rounded"
                        radius={12}
                        tone="mauve"
                      />
                    </div>
                    <div className="text-sm font-semibold text-purple-deep group-hover:text-rose transition-colors line-clamp-1">
                      {d.name}
                    </div>
                    <div className="text-xs text-tan mb-2 truncate">{d.subtitle}</div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-base text-rose">
                        {formatPrice(d.priceCents)}
                      </span>
                      {d.compareAtPriceCents ? (
                        <span className="text-xs text-lilac/60 line-through">
                          {formatPrice(d.compareAtPriceCents)}
                        </span>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* recommended */}
            <div>
              <div className="flex justify-between items-baseline mb-4.5">
                <h2 className="font-heading text-[22px] text-purple-deep">Recommended for You</h2>
                <Link href="/deals" className="text-[13.5px] font-semibold hover:text-rose transition-colors">
                  View All →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {exploreRecommended.map((r) => (
                  <Link
                    key={r.id}
                    href={`/deals/${r.slug}`}
                    className="bg-cream-alt border border-border rounded-2xl p-3.5 card-hover block group"
                  >
                    <ImageSlot
                      label={r.imageLabel}
                      imageUrl={r.imageUrl}
                      className="w-full h-[140px] mb-3"
                      shape="rounded"
                      radius={12}
                      tone="pink"
                    />
                    <div className="text-sm font-semibold text-purple-deep group-hover:text-rose transition-colors line-clamp-1">
                      {r.name}
                    </div>
                    <div className="text-xs text-tan mb-2 truncate">{r.subtitle}</div>
                    <div className="font-heading font-bold text-base text-rose">
                      {formatPrice(r.priceCents)}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </main>

          {/* right panel */}
          <aside className="border border-border bg-cream-alt rounded-2xl p-5 h-fit flex flex-col gap-5">
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-heading text-[17px] text-purple-deep font-bold">
                  Saved Picks ({exploreSaved.length})
                </h3>
              </div>
              <div className="flex flex-col">
                {exploreSaved.map((s) => (
                  <Link
                    key={s.id}
                    href={`/deals/${s.slug}`}
                    className="flex gap-3 py-3 border-b border-border last:border-b-0 card-hover group block"
                  >
                    <ImageSlot
                      label={s.imageLabel}
                      imageUrl={s.imageUrl}
                      className="w-13 h-13 shrink-0"
                      shape="rounded"
                      radius={10}
                      tone="mauve"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-purple-deep leading-snug group-hover:text-rose transition-colors line-clamp-1">
                        {s.name}
                      </div>
                      <div className="text-[11.5px] text-tan mt-0.5 truncate">{s.subtitle}</div>
                      <div className="font-heading font-bold text-[13.5px] text-rose mt-1">
                        {formatPrice(s.priceCents)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {exploreSuggestions.length > 0 && (
              <div className="pt-3 border-t border-border">
                <h4 className="font-heading text-sm text-purple-deep font-bold mb-3">
                  You Might Also Like
                </h4>
                <div className="flex flex-col gap-1">
                  {exploreSuggestions.map((sg) => (
                    <Link
                      key={sg.id}
                      href={`/deals/${sg.slug}`}
                      className="flex gap-3 items-center py-2 card-hover group block"
                    >
                      <ImageSlot
                        label={sg.imageLabel}
                        imageUrl={sg.imageUrl}
                        className="w-10 h-10 shrink-0"
                        shape="rounded"
                        radius={8}
                        tone="pink"
                      />
                      <div className="flex-1 text-[12.5px] font-medium text-purple-deep group-hover:text-rose transition-colors line-clamp-1">
                        {sg.name}
                      </div>
                      <span className="font-heading font-bold text-[12.5px] text-rose">
                        {formatPrice(sg.priceCents)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-mauve-50 border border-border rounded-2xl p-4.5">
              <div className="font-heading text-[15px] text-plum font-bold mb-1.5">Join the Club</div>
              <div className="text-xs text-plum/80 mb-3.5 leading-snug">
                Early access to guides and exclusive picks.
              </div>
              <Link
                href="/#subscribe"
                className="inline-block bg-plum text-white text-[12.5px] font-bold px-4 py-2.5 rounded-full hover:bg-plum/90 transition-colors"
              >
                Join Now
              </Link>
            </div>
          </aside>
        </div>
      </div>
      <SiteFooter />
    </>
  );
}
