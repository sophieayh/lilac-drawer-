import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPrice, formatPriceFixed } from "@/lib/format";

export interface ProductEmbedData {
  name: string | null;
  slug: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageLabel?: string | null;
  category?: string | null;
  priceCents?: number | null;
  compareAtPriceCents?: number | null;
  discountPercent?: number | null;
  badge?: string | null;
  inStock?: boolean | null;
}

interface ProductEmbedCardProps {
  product: ProductEmbedData;
}

export default function ProductEmbedCard({ product }: ProductEmbedCardProps) {
  if (!product.slug || !product.name) return null;

  return (
    <Link
      href={`/deals/${product.slug}`}
      className="group block border border-border/90 rounded-2xl p-4 my-3 bg-gradient-to-br from-mauve-50/80 via-white/80 to-cream/60 hover:bg-mauve-50 hover:border-lilac transition-all shadow-[0_2px_12px_rgba(90,47,69,0.04)] hover:shadow-[0_4px_18px_rgba(90,47,69,0.08)]"
    >
      <div className="flex flex-col-reverse sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Header Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
            {product.category && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose/15 text-rose text-[10.5px] font-bold uppercase tracking-wider">
                {product.category}
              </span>
            )}
            {product.badge && (
              <span className="px-2 py-0.5 rounded-full bg-purple-deep text-white text-[10px] font-bold uppercase tracking-wider">
                {product.badge}
              </span>
            )}
            {product.discountPercent && product.discountPercent > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                -{product.discountPercent}% OFF
              </span>
            )}
            <span className="text-[11px] text-tan-dark font-medium hidden sm:inline">
              Lilac Drawer Pick
            </span>
          </div>

          {/* Product Title */}
          <h4 className="font-heading text-[15px] sm:text-base font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h4>

          {/* Subtitle / Excerpt */}
          {product.subtitle && (
            <p className="text-xs text-tan-dark line-clamp-1 mt-1 leading-relaxed">
              {product.subtitle}
            </p>
          )}

          {/* Pricing Row & CTA */}
          <div className="flex items-center justify-between gap-3 mt-3 pt-2 border-t border-border/60">
            <div className="flex items-baseline gap-2">
              {product.priceCents != null && (
                <span className="font-heading font-bold text-base sm:text-lg text-rose">
                  {formatPrice(product.priceCents)}
                </span>
              )}
              {product.compareAtPriceCents != null && (
                <span className="text-xs text-tan line-through">
                  {formatPriceFixed(product.compareAtPriceCents)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-[11.5px] font-bold text-purple-deep group-hover:text-rose transition-colors shrink-0">
              <span>View Deal & Details</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>
        </div>

        {/* Product Photo / Thumbnail */}
        {product.imageUrl ? (
          <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl overflow-hidden shrink-0 border border-border/80 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt={product.imageLabel || product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : product.imageLabel ? (
          <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl overflow-hidden shrink-0 border border-border/80 bg-white">
            <ImageSlot
              label={product.imageLabel}
              className="w-full h-full"
              shape="rounded"
              radius={12}
              tone="mauve"
            />
          </div>
        ) : (
          <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl overflow-hidden shrink-0 bg-mauve-100 flex items-center justify-center text-2xl text-purple-deep border border-border/80">
            🛍️
          </div>
        )}
      </div>
    </Link>
  );
}
