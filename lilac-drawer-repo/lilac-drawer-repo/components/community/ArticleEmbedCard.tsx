import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";

interface ArticleEmbedCardProps {
  article: {
    title: string | null;
    slug: string | null;
    excerpt?: string | null;
    imageUrl?: string | null;
    imageLabel?: string | null;
    category?: string | null;
    author?: string | null;
  };
}

export default function ArticleEmbedCard({ article }: ArticleEmbedCardProps) {
  if (!article.slug || !article.title) return null;

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block border border-border/90 rounded-2xl p-4 my-3 bg-mauve-50/70 hover:bg-mauve-50/90 hover:border-lilac transition-all shadow-[0_2px_12px_rgba(90,47,69,0.03)]"
    >
      <div className="flex flex-col-reverse sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-lilac/20 text-purple-deep text-[10.5px] font-bold uppercase tracking-wider">
              {article.category || "Article"}
            </span>
            <span className="text-[11px] text-tan-dark font-medium">Lilac Drawer Editorial</span>
          </div>

          <h4 className="font-heading text-[15px] sm:text-base font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
            {article.title}
          </h4>

          {article.excerpt && (
            <p className="text-xs text-tan-dark line-clamp-2 mt-1.5 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-1 text-[11.5px] font-bold text-rose mt-2.5">
            <span>Read full guide & buying tips</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </div>
        </div>

        {article.imageUrl ? (
          <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl overflow-hidden shrink-0 border border-border/80 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.imageUrl}
              alt={article.imageLabel || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : article.imageLabel ? (
          <div className="w-full sm:w-28 sm:h-28 h-40 rounded-xl overflow-hidden shrink-0">
            <ImageSlot
              label={article.imageLabel}
              className="w-full h-full"
              shape="rounded"
              radius={12}
              tone="mauve"
            />
          </div>
        ) : null}
      </div>
    </Link>
  );
}
