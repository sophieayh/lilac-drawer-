import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPriceFixed } from "@/db/queries";
import type { products, ArticleStorePrice } from "@/db/schema";

type Product = typeof products.$inferSelect;

interface Props {
  product: Product;
  relatedArticle?: {
    slug: string;
    title: string;
  } | null;
}

export default function SmartProductCard({ product, relatedArticle }: Props) {
  const stores: ArticleStorePrice[] = Array.isArray(product.stores) ? product.stores : [];
  const primaryAffiliateUrl =
    product.affiliateUrl || (stores.length > 0 && stores[0].url ? stores[0].url : "#");

  const hasArticle = Boolean(relatedArticle?.slug);
  const mainTargetUrl = hasArticle ? `/blog/${relatedArticle!.slug}` : primaryAffiliateUrl;
  const isExternal = !hasArticle;

  const primaryStoreName = stores.length > 0 && stores[0].storeName ? stores[0].storeName : "Store";

  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col justify-between group">
      <div>
        {/* Product Image Box */}
        <div className="relative aspect-[4/3] bg-mauve-50/50 p-5 overflow-hidden flex items-center justify-center">
          {hasArticle ? (
            <Link href={mainTargetUrl} className="block w-full h-full">
              <ImageSlot
                imageUrl={product.imageUrl}
                label={product.imageLabel || product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </Link>
          ) : (
            <a
              href={mainTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full h-full"
            >
              <ImageSlot
                imageUrl={product.imageUrl}
                label={product.imageLabel || product.name}
                className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
              />
            </a>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.badge && (
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-gold/90 text-white shadow-sm">
                {product.badge}
              </span>
            )}
            {hasArticle && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lilac text-white shadow-sm flex items-center gap-1">
                <span>Review Available</span>
              </span>
            )}
          </div>

          {product.discountPercent && product.discountPercent > 0 && (
            <span className="absolute top-3 right-3 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose text-white shadow-sm">
              -{product.discountPercent}%
            </span>
          )}
        </div>

        {/* Product Details */}
        <div className="p-5 flex flex-col gap-2">
          {product.category && (
            <span className="text-[11px] font-bold uppercase tracking-wider text-tan-dark">
              {product.category}
            </span>
          )}

          {hasArticle ? (
            <Link href={mainTargetUrl} className="block">
              <h3 className="font-heading text-base text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
                {product.name}
              </h3>
            </Link>
          ) : (
            <a
              href={mainTargetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <h3 className="font-heading text-base text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
                {product.name}
              </h3>
            </a>
          )}

          {product.subtitle && (
            <p className="text-xs text-tan-dark line-clamp-1">{product.subtitle}</p>
          )}

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-bold text-base text-purple-deep">
              {formatPriceFixed(product.priceCents)}
            </span>
            {product.compareAtPriceCents && (
              <span className="text-xs text-tan-dark line-through font-normal">
                {formatPriceFixed(product.compareAtPriceCents)}
              </span>
            )}
          </div>

          {/* Multi-Store Pills */}
          {stores.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {stores.slice(0, 3).map((st, idx) => (
                <a
                  key={st.id || idx}
                  href={st.url || primaryAffiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-mauve-50 hover:bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-md border border-border/80 transition-colors"
                >
                  <span>{st.storeName}:</span>
                  <span className="font-bold">{st.price || formatPriceFixed(product.priceCents)}</span>
                  <span className="text-[9px] text-tan-dark">↗</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Action Button */}
      <div className="p-5 pt-0">
        {hasArticle ? (
          <div className="flex flex-col gap-2">
            <Link
              href={mainTargetUrl}
              className="w-full text-center py-2.5 px-4 rounded-xl bg-purple-deep text-white text-xs font-bold shadow-sm hover:bg-purple-deep/90 transition-all flex items-center justify-center gap-1.5"
            >
              <span>Read Full Review</span>
              <span>→</span>
            </Link>
            {primaryAffiliateUrl && primaryAffiliateUrl !== "#" && (
              <a
                href={primaryAffiliateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full text-center py-1.5 px-3 rounded-lg text-[11px] font-semibold text-tan-dark hover:text-rose transition-colors"
              >
                Direct to {primaryStoreName} ↗
              </a>
            )}
          </div>
        ) : (
          <a
            href={mainTargetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center py-2.5 px-4 rounded-xl bg-lilac text-white text-xs font-bold shadow-sm hover:bg-lilac/90 transition-all flex items-center justify-center gap-1.5"
          >
            <span>Buy on {primaryStoreName}</span>
            <span>↗</span>
          </a>
        )}
      </div>
    </div>
  );
}
