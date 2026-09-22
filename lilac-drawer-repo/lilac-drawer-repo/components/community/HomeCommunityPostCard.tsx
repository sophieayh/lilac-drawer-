import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import CommunityText from "@/components/community/CommunityText";
import type { CommunityPostItem } from "@/components/community/PostCard";
import { formatPrice, relativeTime } from "@/lib/format";

interface HomeCommunityPostCardProps {
  post: CommunityPostItem;
  variant?: "compact" | "banner" | "spotlight";
}

export default function HomeCommunityPostCard({
  post,
  variant = "compact",
}: HomeCommunityPostCardProps) {
  const isBareRepost = !!post.repostOfId && !post.body.trim();
  const effectiveBody = isBareRepost ? (post.originalBody || "") : post.body;
  const effectiveAuthorName = isBareRepost && post.originalAuthorName ? post.originalAuthorName : post.authorName;
  const effectiveAuthorHandle = isBareRepost && post.originalAuthorHandle ? post.originalAuthorHandle : post.authorHandle;
  const effectiveAuthorImage = isBareRepost ? (post.originalAuthorImage ?? post.authorImage) : post.authorImage;
  const effectivePostId = isBareRepost && post.repostOfId ? post.repostOfId : post.id;

  // Attached product details (direct or reposted)
  const productSlug = post.productSlug || post.originalProductSlug;
  const productName = post.productName || post.originalProductName;
  const productPrice = post.productPriceCents ?? post.originalProductPriceCents;
  const productImageUrl = post.productImageUrl || post.originalProductImageUrl;

  // 1. BANNER VARIANT (Wide horizontal editorial block)
  if (variant === "banner") {
    return (
      <section className="px-4 sm:px-6 md:px-12 py-6 sm:py-10 max-w-[1400px] mx-auto">
        <div className="bg-gradient-to-br from-mauve-50 via-pink-50/50 to-cream border border-border-mauve rounded-3xl p-5 sm:p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-border/80 pb-3.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose animate-pulse" />
              <span className="font-heading text-base sm:text-lg font-bold text-purple-deep uppercase tracking-wide">
                Trending in Community
              </span>
              <span className="text-[11px] font-bold text-rose bg-pink-100 px-2.5 py-0.5 rounded-full ml-1">
                24h Top Pick
              </span>
            </div>
            <Link
              href="/community"
              className="text-xs font-bold uppercase tracking-wider text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
            >
              <span>Explore Community</span>
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
          </div>

          <div className="grid md:grid-cols-[auto_1fr] gap-4 sm:gap-6 items-start">
            <Link href={`/community/${effectiveAuthorHandle}`} className="shrink-0">
              {effectiveAuthorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveAuthorImage}
                  alt={`${effectiveAuthorName} avatar`}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-lilac/40 shadow-xs"
                />
              ) : (
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold text-lg border-2 border-lilac/40 shadow-xs">
                  {effectiveAuthorName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-2 mb-1.5">
                <Link
                  href={`/community/${effectiveAuthorHandle}`}
                  className="font-semibold text-purple-deep hover:underline text-sm sm:text-base"
                >
                  {effectiveAuthorName}
                </Link>
                <Link
                  href={`/community/post/${effectivePostId}`}
                  className="text-tan text-xs hover:underline"
                  suppressHydrationWarning
                >
                  @{effectiveAuthorHandle} · {relativeTime(post.postedAt)} ago
                </Link>
              </div>

              {effectiveBody && (
                <CommunityText
                  text={effectiveBody}
                  navigateOnCardClick={`/community/post/${effectivePostId}`}
                  className="text-sm sm:text-[15.5px] leading-relaxed text-ink mb-3.5 cursor-pointer whitespace-pre-wrap break-words"
                />
              )}

              {/* Attached Product chip if present */}
              {productSlug && productName && (
                <Link
                  href={`/deals/${productSlug}`}
                  className="inline-flex items-center gap-3 p-2.5 sm:p-3 mb-3.5 rounded-xl bg-white border border-border/90 hover:border-rose/50 transition-colors shadow-2xs group max-w-md"
                >
                  {productImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={productImageUrl}
                      alt={productName}
                      className="w-10 h-10 rounded-lg object-cover border border-lilac/20 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-purple-deep group-hover:text-rose truncate transition-colors">
                      {productName}
                    </div>
                    {productPrice != null && (
                      <div className="text-xs font-bold text-rose">{formatPrice(productPrice)}</div>
                    )}
                  </div>
                  <span className="text-xs font-bold text-tan group-hover:text-rose shrink-0">View Deal →</span>
                </Link>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-tan pt-2 border-t border-border/50">
                <span className="flex items-center gap-1.5 text-rose font-bold">
                  <svg className="w-3.5 h-3.5 fill-rose shrink-0" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                  {post.likeCount} {post.likeCount === 1 ? "Like" : "Likes"}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1.5 text-purple-deep font-semibold">
                  <svg className="w-3.5 h-3.5 text-purple-deep shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  {post.commentCount} {post.commentCount === 1 ? "Comment" : "Comments"}
                </span>
                <Link
                  href={`/community/post/${effectivePostId}`}
                  className="ml-auto font-semibold text-rose hover:underline inline-flex items-center gap-1 group/btn"
                >
                  <span>Join Discussion</span>
                  <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // 2. SPOTLIGHT VARIANT (Card layout suited for grid or pre-newsletter section)
  if (variant === "spotlight") {
    return (
      <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs hover:border-lilac/70 transition-colors flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-rose uppercase tracking-wider bg-pink-100/80 px-2.5 py-0.5 rounded-full">
              Community Spotlight
            </span>
            <span className="text-xs font-bold text-rose flex items-center gap-1">
              <svg className="w-3 h-3 fill-rose shrink-0" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {post.likeCount}
            </span>
          </div>

          <div className="flex items-center gap-3 mb-2.5">
            <Link href={`/community/${effectiveAuthorHandle}`}>
              {effectiveAuthorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveAuthorImage}
                  alt={`${effectiveAuthorName} avatar`}
                  className="w-9 h-9 rounded-full object-cover border border-lilac/30"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-xs">
                  {effectiveAuthorName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <Link href={`/community/${effectiveAuthorHandle}`} className="font-semibold text-purple-deep text-sm block hover:underline truncate">
                {effectiveAuthorName}
              </Link>
              <span className="text-tan text-[11px]">@{effectiveAuthorHandle}</span>
            </div>
          </div>

          {effectiveBody && (
            <CommunityText
              text={effectiveBody}
              navigateOnCardClick={`/community/post/${effectivePostId}`}
              className="text-[13.5px] leading-relaxed text-ink line-clamp-3 mb-3 cursor-pointer whitespace-pre-wrap break-words"
            />
          )}

          {/* Attached Product chip if present */}
          {productSlug && productName && (
            <Link
              href={`/deals/${productSlug}`}
              className="inline-flex items-center gap-2.5 p-2 mb-3 rounded-xl bg-mauve-50/70 border border-border-mauve hover:border-rose/50 transition-colors shadow-2xs group max-w-full"
            >
              {productImageUrl && (
                <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 border border-lilac/20 bg-white">
                  <ImageSlot
                    label={productName}
                    imageUrl={productImageUrl}
                    className="w-full h-full object-cover"
                    tone="pink"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-purple-deep truncate group-hover:text-rose transition-colors">
                  {productName}
                </div>
                {productPrice != null && (
                  <div className="text-[11px] font-bold text-rose">
                    {formatPrice(productPrice)}
                  </div>
                )}
              </div>
            </Link>
          )}
        </div>

        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/70 mt-2">
          <span className="text-tan text-[11px]">{post.commentCount} replies</span>
          <Link
            href={`/community/post/${effectivePostId}`}
            className="font-semibold text-rose hover:underline inline-flex items-center gap-0.5"
          >
            <span>View Post</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. COMPACT VARIANT (For Hero Sidebar)
  return (
    <div className="mt-6 pt-5 border-t border-pink-100">
      <div className="bg-gradient-to-br from-mauve-50 to-pink-50/50 border border-border-mauve rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-bold text-rose uppercase tracking-wider bg-pink-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            Community Pick
          </span>
          <span className="text-[11.5px] font-bold text-rose flex items-center gap-1">
            <svg className="w-3 h-3 fill-rose shrink-0" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {post.likeCount}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Link href={`/community/${effectiveAuthorHandle}`}>
            {effectiveAuthorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={effectiveAuthorImage}
                alt={`${effectiveAuthorName} avatar`}
                className="w-7 h-7 rounded-full object-cover border border-lilac/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-[10px]">
                {effectiveAuthorName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/community/${effectiveAuthorHandle}`} className="font-semibold text-purple-deep text-xs block hover:underline truncate">
              {effectiveAuthorName}
            </Link>
          </div>
        </div>

        {effectiveBody && (
          <CommunityText
            text={effectiveBody}
            navigateOnCardClick={`/community/post/${effectivePostId}`}
            className="text-xs leading-relaxed text-ink line-clamp-3 mb-2.5 cursor-pointer whitespace-pre-wrap break-words"
          />
        )}

        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
          <span className="text-tan">{post.commentCount} replies</span>
          <Link
            href={`/community/post/${effectivePostId}`}
            className="font-bold text-rose hover:underline"
          >
            Read Post →
          </Link>
        </div>
      </div>
    </div>
  );
}
