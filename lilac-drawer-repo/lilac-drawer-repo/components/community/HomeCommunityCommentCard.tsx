import Link from "next/link";
import CommunityText from "@/components/community/CommunityText";
import type { FeaturedCommunityComment } from "@/db/queries";
import { relativeTime } from "@/lib/format";

interface HomeCommunityCommentCardProps {
  comment: FeaturedCommunityComment;
  variant?: "quote" | "compact" | "spotlight";
}

export default function HomeCommunityCommentCard({
  comment,
  variant = "quote",
}: HomeCommunityCommentCardProps) {
  // 1. QUOTE VARIANT (Editorial block between sections)
  if (variant === "quote") {
    return (
      <section className="px-4 sm:px-6 md:px-12 py-6 sm:py-8 max-w-[1400px] mx-auto">
        <div className="bg-gradient-to-r from-cream-alt via-mauve-50/60 to-pink-50/40 border border-border-mauve rounded-3xl p-5 sm:p-8 shadow-xs relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4 border-b border-border/70 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-deep bg-mauve-100 px-2.5 py-0.5 rounded-full">
                Reader Take
              </span>
              {comment.postAuthorHandle && (
                <span className="text-xs text-tan hidden sm:inline">
                  on{" "}
                  <Link href={`/community/post/${comment.postId}`} className="font-semibold text-purple-deep hover:underline">
                    @{comment.postAuthorHandle}&apos;s post
                  </Link>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-rose flex items-center gap-1.5 bg-pink-100/70 px-2.5 py-0.5 rounded-full">
                <svg className="w-3.5 h-3.5 fill-rose shrink-0" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {comment.likeCount} {comment.likeCount === 1 ? "Like" : "Likes"}
              </span>
              <Link
                href={`/community/post/${comment.postId}`}
                className="text-xs font-bold uppercase tracking-wider text-purple-deep hover:text-rose transition-colors inline-flex items-center gap-1 group"
              >
                <span>View Context</span>
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>

          <div className="my-3">
            <CommunityText
              text={comment.body}
              navigateOnCardClick={`/community/post/${comment.postId}`}
              className="font-heading italic text-[16px] sm:text-[19px] leading-relaxed text-purple-deep cursor-pointer whitespace-pre-wrap break-words"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border/50">
            <div className="flex items-center gap-2.5">
              <Link href={`/community/${comment.authorHandle}`}>
                {comment.authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.authorImage}
                    alt={`${comment.authorName} avatar`}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-lilac/30"
                  />
                ) : (
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-xs">
                    {comment.authorName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </Link>
              <div>
                <Link
                  href={`/community/${comment.authorHandle}`}
                  className="font-semibold text-xs sm:text-sm text-purple-deep hover:underline"
                >
                  {comment.authorName}
                </Link>{" "}
                <span className="text-tan text-[11px] sm:text-xs">@{comment.authorHandle}</span>
              </div>
            </div>

            <Link
              href={`/community/post/${comment.postId}`}
              className="text-xs font-semibold text-rose hover:underline"
            >
              Join conversation →
            </Link>
          </div>
        </div>
      </section>
    );
  }

  // 2. SPOTLIGHT VARIANT (Card layout for grid or pre-newsletter section)
  if (variant === "spotlight") {
    return (
      <div className="bg-white border border-border rounded-2xl p-5 sm:p-6 shadow-xs hover:border-lilac/70 transition-colors flex flex-col justify-between h-full">
        <div>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[11px] font-bold text-purple-deep uppercase tracking-wider bg-mauve-100 px-2.5 py-0.5 rounded-full">
              Reader Discussion
            </span>
            <span className="text-xs font-bold text-rose flex items-center gap-1">
              <svg className="w-3 h-3 fill-rose shrink-0" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              {comment.likeCount}
            </span>
          </div>

          <div className="flex items-center gap-2.5 mb-2.5">
            <Link href={`/community/${comment.authorHandle}`}>
              {comment.authorImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={comment.authorImage}
                  alt={`${comment.authorName} avatar`}
                  className="w-8 h-8 rounded-full object-cover border border-lilac/30"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-xs">
                  {comment.authorName?.charAt(0)?.toUpperCase() || "U"}
                </div>
              )}
            </Link>
            <div className="min-w-0">
              <Link href={`/community/${comment.authorHandle}`} className="font-semibold text-purple-deep text-xs sm:text-sm block hover:underline truncate">
                {comment.authorName}
              </Link>
              <span className="text-tan text-[11px]">@{comment.authorHandle}</span>
            </div>
          </div>

          <CommunityText
            text={comment.body}
            navigateOnCardClick={`/community/post/${comment.postId}`}
            className="text-xs sm:text-[13.5px] leading-relaxed text-ink line-clamp-3 mb-3 cursor-pointer whitespace-pre-wrap break-words"
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-border/70 mt-2">
          <span className="text-tan text-[11px]">
            {comment.postAuthorHandle ? `on @${comment.postAuthorHandle}'s post` : "in Community"}
          </span>
          <Link
            href={`/community/post/${comment.postId}`}
            className="font-semibold text-rose hover:underline inline-flex items-center gap-0.5"
          >
            <span>Read full →</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. COMPACT VARIANT (For Hero Sidebar)
  return (
    <div className="mt-6 pt-5 border-t border-pink-100">
      <div className="bg-gradient-to-br from-mauve-50 to-pink-50/50 border border-border-mauve rounded-2xl p-4 shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-purple-deep uppercase tracking-wider bg-mauve-100 px-2 py-0.5 rounded-full flex items-center gap-1">
            Reader Thought
          </span>
          <span className="text-[11.5px] font-bold text-rose flex items-center gap-1">
            <svg className="w-3 h-3 fill-rose shrink-0" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {comment.likeCount}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <Link href={`/community/${comment.authorHandle}`}>
            {comment.authorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={comment.authorImage}
                alt={`${comment.authorName} avatar`}
                className="w-7 h-7 rounded-full object-cover border border-lilac/30"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-[10px]">
                {comment.authorName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Link>
          <div className="min-w-0 flex-1">
            <Link href={`/community/${comment.authorHandle}`} className="font-semibold text-purple-deep text-xs block hover:underline truncate">
              {comment.authorName}
            </Link>
          </div>
        </div>

        <CommunityText
          text={comment.body}
          navigateOnCardClick={`/community/post/${comment.postId}`}
          className="text-xs leading-relaxed text-ink line-clamp-3 mb-2.5 cursor-pointer whitespace-pre-wrap break-words italic"
        />

        <div className="flex items-center justify-between text-[11px] pt-2 border-t border-border/60">
          <span className="text-tan truncate max-w-[120px]">
            {comment.postAuthorHandle ? `@${comment.postAuthorHandle}` : "Community"}
          </span>
          <Link
            href={`/community/post/${comment.postId}`}
            className="font-bold text-rose hover:underline shrink-0"
          >
            View Thread →
          </Link>
        </div>
      </div>
    </div>
  );
}
