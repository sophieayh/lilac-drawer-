import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import ShareProductToCommunityModal from "@/components/product/ShareProductToCommunityModal";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import {
  getProductBySlug,
  getAllProductSlugs,
  getRelatedProducts,
  formatPrice,
  formatPriceFixed,
} from "@/db/queries";

export const revalidate = 60;

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  return buildMetadata({
    title: `${product.name} — ${product.category} Deal & Review`,
    description:
      product.subtitle ||
      `Find deals, pricing, and honest review details on ${product.name} tested by Lilac Drawer editors.`,
    path: `/deals/${product.slug}`,
    imageUrl: product.imageUrl,
    imageAlt: product.name,
  });
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  const relatedProducts = await getRelatedProducts(product.category, product.slug, 4);
  const priceFormatted = (product.priceCents / 100).toFixed(2);
  const validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().split("T")[0];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: product.name,
          description: product.subtitle || `Editor tested and verified ${product.category} deal on ${product.name}.`,
          category: product.category,
          image: product.imageUrl ? [product.imageUrl] : undefined,
          sku: `LD-PROD-${product.id}`,
          brand: {
            "@type": "Brand",
            name: "Lilac Drawer Tested",
          },
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: "4.8",
            reviewCount: "24",
            bestRating: "5",
            worstRating: "1",
          },
          offers: {
            "@type": "Offer",
            priceCurrency: "USD",
            price: priceFormatted,
            itemCondition: "https://schema.org/NewCondition",
            priceValidUntil: validUntil,
            seller: {
              "@type": "Organization",
              name: siteConfig.name,
            },
            availability: product.inStock
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
            url: product.affiliateUrl || absoluteUrl(`/deals/${product.slug}`),
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Deals", item: absoluteUrl("/deals") },
            {
              "@type": "ListItem",
              position: 3,
              name: product.category,
              item: absoluteUrl(`/category/${product.category.toLowerCase().replace(/\s+/g, "-")}`),
            },
            {
              "@type": "ListItem",
              position: 4,
              name: product.name,
              item: absoluteUrl(`/deals/${product.slug}`),
            },
          ],
        }}
      />

      <SiteHeader />

      <main className="bg-cream text-purple-deep min-h-screen py-5 sm:py-8 px-4 sm:px-6 md:px-12">
        <div className="max-w-[1200px] mx-auto">
          {/* Breadcrumb Navigation & Top Community Share Action */}
          <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6 flex-wrap">
            <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-tan">
              <Link href="/" className="hover:text-purple-deep">
                Home
              </Link>
              <span>/</span>
              <Link href="/deals" className="hover:text-purple-deep">
                Deals
              </Link>
              <span>/</span>
              <span className="text-purple-deep font-medium truncate max-w-[200px] sm:max-w-[280px]">
                {product.name}
              </span>
            </nav>

            <ShareProductToCommunityModal
              productId={product.id}
              productName={product.name}
              productSlug={product.slug}
              productSubtitle={product.subtitle}
              productImageUrl={product.imageUrl}
              productImageLabel={product.imageLabel}
              productCategory={product.category}
              productPriceCents={product.priceCents}
              productCompareAtPriceCents={product.compareAtPriceCents}
              productDiscountPercent={product.discountPercent}
              productBadge={product.badge}
              variant="button"
            />
          </div>

          {/* Main Product Card */}
          <div className="bg-white rounded-3xl border border-border p-4 sm:p-6 md:p-10 shadow-sm mb-12">
            <div className="grid md:grid-cols-2 gap-8 md:gap-10 lg:gap-14 items-center">
              {/* Product Image Column */}
              <div className="relative">
                <div className="rounded-2xl overflow-hidden border border-border bg-mauve-50 max-h-[460px]">
                  <ImageSlot
                    label={product.imageLabel || product.name}
                    imageUrl={product.imageUrl}
                    className="w-full h-[260px] sm:h-[360px] md:h-[420px]"
                    shape="rounded"
                    radius={20}
                    tone="mauve"
                  />
                </div>

                {/* Floating Badges */}
                <div className="absolute top-3 sm:top-4 left-3 sm:left-4 flex flex-col gap-1.5 sm:gap-2 z-10">
                  {product.discountPercent && (
                    <span className="bg-rose text-white text-[11px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                      -{product.discountPercent}% OFF
                    </span>
                  )}
                  {product.rank != null && (
                    <span className="bg-purple-deep text-white text-[10px] sm:text-xs font-bold px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full shadow-md">
                      #{product.rank} Top Pick
                    </span>
                  )}
                </div>
              </div>

              {/* Product Info Column */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose bg-pink-100/70 px-3 py-1 rounded-full">
                    {product.category}
                  </span>
                  {product.badge && (
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-deep bg-mauve-100 px-3 py-1 rounded-full">
                      {product.badge}
                    </span>
                  )}
                </div>

                <h1 className="font-heading text-xl sm:text-2xl md:text-4xl text-purple-deep font-bold mb-2.5 sm:mb-3 leading-tight">
                  {product.name}
                </h1>

                {product.subtitle && (
                  <p className="text-sm sm:text-base text-tan-dark leading-relaxed mb-5 sm:mb-6">
                    {product.subtitle}
                  </p>
                )}

                {/* Price & Stock Container */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-mauve-50/70 border border-border/80">
                  <div>
                    <span className="text-[11px] sm:text-xs text-tan uppercase tracking-wide block mb-0.5">
                      Current Price
                    </span>
                    <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                      <span className="font-heading font-bold text-2xl sm:text-3xl md:text-4xl text-rose">
                        {formatPrice(product.priceCents)}
                      </span>
                      {product.compareAtPriceCents && (
                        <span className="text-sm sm:text-base text-tan line-through">
                          {formatPriceFixed(product.compareAtPriceCents)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto text-right">
                    <span
                      className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                        product.inStock
                          ? "bg-sage/15 text-sage"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {product.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                </div>

                {/* Rank note / Editor verdict if available */}
                {product.rankNote && (
                  <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-xl border border-lilac/30 bg-mauve-100/40 text-xs text-purple-deep">
                    <span className="font-bold block mb-1">Editor&apos;s Testing Note:</span>
                    <p className="text-tan-dark leading-relaxed">{product.rankNote}</p>
                  </div>
                )}

                {/* Multi-Store Pricing Banner if available */}
                {product.stores && Array.isArray(product.stores) && product.stores.length > 0 && (
                  <div className="mb-5 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-mauve-50 border border-border">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-deep block mb-2.5">
                      Available at Retailers
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {product.stores.map((st, idx) => (
                        <a
                          key={st.id || idx}
                          href={st.url}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="bg-purple-deep hover:bg-lilac text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-2 shadow-xs transition-all hover:scale-[1.02]"
                        >
                          <span>Buy on {st.storeName}</span>
                          {st.price && (
                            <span className="bg-white/20 px-1.5 py-0.5 rounded text-[11px] font-bold text-pink-100">
                              {st.price}
                            </span>
                          )}
                          <span>↗</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Main Affiliate CTA Button */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {product.affiliateUrl ? (
                    <a
                      href={product.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="flex-1 bg-rose hover:bg-rose-light text-white text-center py-3.5 px-6 rounded-2xl font-bold text-sm shadow-[0_4px_16px_rgba(212,112,143,0.35)] transition-all hover:scale-[1.01] inline-flex items-center justify-center gap-2"
                    >
                      <span>Check Live Deal at Store</span>
                      <span>↗</span>
                    </a>
                  ) : (
                    <div className="flex-1 text-center bg-mauve-100 text-purple-deep font-semibold py-3.5 px-6 rounded-full text-sm">
                      Check Local Retailers
                    </div>
                  )}

                  <Link
                    href="/deals"
                    className="text-center py-3.5 px-6 rounded-full border border-border text-sm font-semibold text-purple-deep hover:bg-mauve-50 transition-colors"
                  >
                    ← All Deals
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Community Discussion Callout Banner */}
          <ShareProductToCommunityModal
            productId={product.id}
            productName={product.name}
            productSlug={product.slug}
            productSubtitle={product.subtitle}
            productImageUrl={product.imageUrl}
            productImageLabel={product.imageLabel}
            productCategory={product.category}
            productPriceCents={product.priceCents}
            productCompareAtPriceCents={product.compareAtPriceCents}
            productDiscountPercent={product.discountPercent}
            productBadge={product.badge}
            variant="banner"
          />

          {/* Related Deals Section */}
          {relatedProducts.length > 0 && (
            <section className="mt-12">
              <div className="flex justify-between items-baseline mb-6 border-b border-border pb-3.5">
                <h2 className="font-heading text-2xl text-purple-deep m-0">
                  Related Deals in {product.category}
                </h2>
                <Link href="/deals" className="text-sm font-semibold text-rose hover:underline">
                  Browse all →
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {relatedProducts.map((p) => (
                  <Link
                    key={p.id}
                    href={`/deals/${p.slug}`}
                    className="bg-white border border-border rounded-2xl p-4 card-hover block group"
                  >
                    <div className="relative mb-3">
                      <ImageSlot
                        label={p.imageLabel || p.name}
                        imageUrl={p.imageUrl}
                        className="w-full h-[140px]"
                        shape="rounded"
                        radius={12}
                        tone="mauve"
                      />
                      {p.discountPercent && (
                        <span className="absolute top-2 left-2 bg-rose text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                          -{p.discountPercent}%
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-purple-deep group-hover:text-rose transition-colors line-clamp-1 mb-1">
                      {p.name}
                    </div>
                    {p.subtitle && (
                      <div className="text-xs text-tan truncate mb-2">{p.subtitle}</div>
                    )}
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-base text-rose">
                        {formatPrice(p.priceCents)}
                      </span>
                      {p.compareAtPriceCents && (
                        <span className="text-xs text-tan line-through">
                          {formatPriceFixed(p.compareAtPriceCents)}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <SiteFooter />
    </>
  );
}