"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { shareProductToCommunity } from "@/lib/community-actions";
import { useSession } from "@/lib/auth-client";
import { formatPrice, formatPriceFixed } from "@/lib/format";
import { checkExternalLinks } from "@/lib/link-moderation";
import ImageSlot from "@/components/ImageSlot";

interface ShareProductToCommunityModalProps {
  productId: number;
  productName: string;
  productSlug: string;
  productSubtitle?: string | null;
  productImageUrl?: string | null;
  productImageLabel?: string | null;
  productCategory?: string | null;
  productPriceCents?: number | null;
  productCompareAtPriceCents?: number | null;
  productDiscountPercent?: number | null;
  productBadge?: string | null;
  variant?: "button" | "banner";
}

export default function ShareProductToCommunityModal({
  productId,
  productName,
  productSlug,
  productSubtitle,
  productImageUrl,
  productImageLabel,
  productCategory,
  productPriceCents,
  productCompareAtPriceCents,
  productDiscountPercent,
  productBadge,
  variant = "button",
}: ShareProductToCommunityModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [opinion, setOpinion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push(`/login?redirect=/deals/${productSlug}`);
      return;
    }

    const trimmed = opinion.trim();
    if (trimmed) {
      const linkCheck = checkExternalLinks(trimmed);
      if (linkCheck.hasExternalLink) {
        setError(linkCheck.errorMessage || "External links are not allowed in community posts.");
        return;
      }
    }

    setError(null);
    startTransition(async () => {
      try {
        await shareProductToCommunity(productId, trimmed);
        setSuccess(true);
        setOpinion("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to share product.");
      }
    });
  }

  return (
    <>
      {/* Trigger Button Variants */}
      {variant === "button" ? (
        <button
          type="button"
          onClick={() => {
            setIsOpen(true);
            setSuccess(false);
            setError(null);
          }}
          className="shrink-0 bg-purple-deep hover:bg-lilac text-white text-xs font-semibold rounded-full px-4 py-2.5 sm:py-2 transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
          </svg>
          <span>Share to Community</span>
        </button>
      ) : (
        <div className="rounded-3xl border border-border/90 bg-gradient-to-br from-mauve-50 via-white to-cream p-6 sm:p-7 shadow-[0_4px_20px_rgba(90,47,69,0.05)] my-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-2 h-2 rounded-full bg-rose animate-pulse" />
                <span className="text-[11px] font-bold text-rose uppercase tracking-wider">
                  Community Discussion
                </span>
              </div>
              <h3 className="font-heading text-lg sm:text-xl font-bold text-purple-deep mb-1">
                Have thoughts or styling tips on this piece?
              </h3>
              <p className="text-xs sm:text-[13px] text-tan-dark leading-relaxed">
                Share your personal review, sizing advice, or styling tips directly with the Lilac Drawer community.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsOpen(true);
                setSuccess(false);
                setError(null);
              }}
              className="bg-purple-deep hover:bg-lilac text-white rounded-full px-6 py-3 text-xs font-bold shadow-[0_4px_14px_rgba(46,37,54,0.18)] transition-all btn-press shrink-0 cursor-pointer flex items-center gap-2"
            >
              <svg className="w-4 h-4 text-lilac-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a.75.75 0 01-1.074-.85 5.97 5.97 0 00.92-2.38 8.18 8.18 0 01-1.256-4.74C4 7.444 8.03 3.75 13 3.75s9 3.694 9 8.25z" />
              </svg>
              <span>Share to Community</span>
            </button>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-purple-deep/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-[540px] bg-white rounded-3xl border border-border shadow-[0_20px_60px_rgba(90,47,69,0.2)] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-mauve-50/70">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-lilac/30 text-purple-deep flex items-center justify-center font-bold text-sm">
                  🛍️
                </span>
                <div>
                  <h3 className="font-heading text-base font-bold text-purple-deep leading-tight">
                    Share Product to Community
                  </h3>
                  <p className="text-[11px] text-tan-dark">Add your thoughts, styling tips, or review</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-white hover:bg-mauve-100 text-tan-dark hover:text-purple-deep flex items-center justify-center text-sm font-bold transition-colors cursor-pointer border border-border"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {success ? (
                <div className="text-center py-6 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3">
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h4 className="font-heading text-xl font-bold text-purple-deep mb-1">
                    Posted Successfully!
                  </h4>
                  <p className="text-xs text-tan-dark max-w-[340px] mb-6 leading-relaxed">
                    Your recommendation and the product deal have been published to the community feed.
                  </p>
                  <div className="flex items-center gap-3">
                    <Link
                      href="/community"
                      onClick={() => setIsOpen(false)}
                      className="bg-purple-deep hover:bg-lilac text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs"
                    >
                      View in Community Feed →
                    </Link>
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 rounded-full border border-border text-tan-dark text-xs font-semibold hover:bg-mauve-50 transition-colors cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                </div>
              ) : !isLoggedIn ? (
                <div className="text-center py-4 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-mauve-100 text-purple-deep flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <h4 className="font-heading text-lg font-bold text-purple-deep mb-1">
                    Sign in Required
                  </h4>
                  <p className="text-xs text-tan-dark max-w-[340px] mb-5 leading-relaxed">
                    You need to be signed in to post and share your recommendations with the Lilac Drawer community.
                  </p>
                  <Link
                    href={`/login?redirect=/deals/${productSlug}`}
                    className="bg-purple-deep hover:bg-lilac text-white px-6 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs"
                  >
                    Sign In to Continue
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {error && (
                    <div className="p-3 bg-rose/10 border border-rose/30 text-rose rounded-xl text-xs font-semibold flex items-center gap-2">
                      <svg className="w-4 h-4 text-rose shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Opinion Textarea */}
                  <div>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <label htmlFor="product-share-opinion" className="text-xs font-bold text-purple-deep uppercase tracking-wider">
                        Your Thoughts & Recommendations
                      </label>
                      <span className="text-[11px] text-tan">{opinion.length} / 2000</span>
                    </div>
                    <textarea
                      id="product-share-opinion"
                      value={opinion}
                      onChange={(e) => setOpinion(e.target.value)}
                      placeholder="Why do you recommend this piece? Share sizing tips, pairing ideas, or your honest review…"
                      rows={4}
                      maxLength={2000}
                      autoFocus
                      className="w-full border border-border rounded-2xl p-3.5 text-sm outline-none focus:border-lilac focus:ring-2 focus:ring-lilac/20 bg-cream-alt text-purple-deep transition-all placeholder:text-tan resize-none"
                    />
                  </div>

                  {/* Embedded Product Attachment Preview */}
                  <div className="rounded-2xl border border-border bg-mauve-50/60 p-3.5 flex items-center gap-3">
                    {productImageUrl ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={productImageUrl}
                          alt={productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : productImageLabel ? (
                      <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-border bg-white">
                        <ImageSlot
                          label={productImageLabel}
                          className="w-full h-full"
                          shape="rounded"
                          radius={10}
                          tone="mauve"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-xl bg-lilac/20 flex items-center justify-center text-base font-bold text-purple-deep shrink-0">
                        🛍️
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {productCategory && (
                          <span className="text-[10px] font-bold text-rose uppercase tracking-wider">
                            {productCategory}
                          </span>
                        )}
                        {productDiscountPercent && productDiscountPercent > 0 && (
                          <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-600 text-white">
                            -{productDiscountPercent}%
                          </span>
                        )}
                      </div>
                      <h5 className="font-heading text-xs sm:text-sm font-bold text-purple-deep truncate">
                        {productName}
                      </h5>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        {productPriceCents != null && (
                          <span className="font-heading font-bold text-xs sm:text-sm text-rose">
                            {formatPrice(productPriceCents)}
                          </span>
                        )}
                        {productCompareAtPriceCents != null && (
                          <span className="text-[10px] text-tan line-through">
                            {formatPriceFixed(productCompareAtPriceCents)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Form Actions */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-4 py-2.5 rounded-full text-xs font-semibold text-tan-dark hover:text-purple-deep transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending}
                      className="bg-purple-deep hover:bg-lilac text-white rounded-full px-6 py-2.5 text-xs font-bold shadow-[0_4px_14px_rgba(46,37,54,0.2)] transition-all btn-press disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                    >
                      {isPending ? "Posting…" : "Post to Community"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
