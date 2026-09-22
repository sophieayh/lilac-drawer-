import Link from "next/link";
import type { CollageData } from "@/db/schema";
import { formatPriceFixed } from "@/lib/format";

interface CollageEmbedCardProps {
  postId: number;
  collageData: CollageData;
  compact?: boolean;
}

export default function CollageEmbedCard({
  postId,
  collageData,
  compact = false,
}: CollageEmbedCardProps) {
  if (!collageData) return null;

  const itemCount = collageData.itemCount || (collageData.items ? collageData.items.length : 0);
  const totalCents = collageData.totalLookCents || 0;

  return (
    <div
      className={`rounded-2xl border border-lilac/35 bg-gradient-to-r from-mauve-50/90 via-white to-mauve-50/60 p-3 sm:p-3.5 shadow-2xs hover:shadow-xs hover:border-lilac/60 transition-all ${
        compact ? "my-1.5" : "my-2.5"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-purple-deep/10 text-purple-deep flex items-center justify-center shrink-0 border border-purple-deep/15">
            <svg
              className="w-5 h-5 text-purple-deep"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-bold text-purple-deep truncate">
                Fashion Moodboard
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-purple-deep/10 text-purple-deep text-[10px] font-semibold tracking-wide">
                Interactive Look
              </span>
            </div>
            <p className="text-[11.5px] text-tan-dark mt-0.5 truncate">
              {itemCount} {itemCount === 1 ? "Piece" : "Pieces"}
              {totalCents > 0 && ` · Total: ${formatPriceFixed(totalCents)}`}
            </p>
          </div>
        </div>

        <Link
          href={`/fashion-collage?post=${postId}`}
          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-deep text-white text-xs font-bold hover:bg-purple-deep/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group"
          title="Open and explore moodboard in sandbox"
        >
          <span>Explore &amp; Customize</span>
          <svg
            className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
