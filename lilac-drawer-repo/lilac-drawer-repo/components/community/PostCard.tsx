import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import LikeButton from "@/components/community/LikeButton";
import RepostButton from "@/components/community/RepostButton";
import ArticleEmbedCard from "@/components/community/ArticleEmbedCard";
import PostImageMedia from "@/components/community/PostImageMedia";
import { relativeTime } from "@/lib/format";

export interface CommunityPostItem {
  id: number;
  body: string;
  imageLabel: string | null;
  hasImage: boolean;
  imageUrl?: string | null;
  productId: number | null;
  repostOfId: number | null;
  articleId?: number | null;
  postedAt: Date;
  commentCount: number;
  repostCount: number;
  likeCount: number;
  authorName: string;
  authorHandle: string;
  authorImage: string | null;
  originalAuthorName?: string | null;
  originalAuthorHandle?: string | null;
  originalAuthorImage?: string | null;
  originalBody?: string | null;
  originalImageLabel?: string | null;
  originalHasImage?: boolean | null;
  originalImageUrl?: string | null;
  originalPostedAt?: Date | null;
  // Attached Article Details (for direct posts)
  articleTitle?: string | null;
  articleSlug?: string | null;
  articleExcerpt?: string | null;
  articleImageUrl?: string | null;
  articleImageLabel?: string | null;
  articleCategory?: string | null;
  articleAuthor?: string | null;
  // Attached Article Details (for reposted posts)
  originalArticleId?: number | null;
  originalArticleTitle?: string | null;
  originalArticleSlug?: string | null;
  originalArticleExcerpt?: string | null;
  originalArticleImageUrl?: string | null;
  originalArticleImageLabel?: string | null;
  originalArticleCategory?: string | null;
  originalArticleAuthor?: string | null;
}

interface PostCardProps {
  post: CommunityPostItem;
  isLiked?: boolean;
  isReposted?: boolean;
  isLoggedIn?: boolean;
}

export default function PostCard({
  post: p,
  isLiked = false,
  isReposted = false,
  isLoggedIn = false,
}: PostCardProps) {
  const isBareRepost = !!p.repostOfId && !p.body.trim();
  const effectivePostId = isBareRepost && p.repostOfId ? p.repostOfId : p.id;
  const effectiveAuthorName = isBareRepost && p.originalAuthorName ? p.originalAuthorName : p.authorName;
  const effectiveAuthorHandle = isBareRepost && p.originalAuthorHandle ? p.originalAuthorHandle : p.authorHandle;
  const effectiveAuthorImage = isBareRepost ? (p.originalAuthorImage ?? p.authorImage) : p.authorImage;
  const effectiveBody = isBareRepost ? (p.originalBody || "") : p.body;
  const effectiveImageUrl = isBareRepost ? (p.originalImageUrl ?? p.imageUrl) : p.imageUrl;

  return (
    <article className="px-6 py-4.5 border-b border-border card-hover">
      {/* If it's a bare repost, show a badge header indicating who reposted */}
      {isBareRepost && (
        <div className="flex items-center gap-2 text-xs font-bold text-tan-dark mb-2.5 pl-12">
          <svg
            className="w-4 h-4 text-emerald-600 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 12v-2a4 4 0 0 1 4-4h12" />
            <path d="M16 2l4 4-4 4" />
            <path d="M20 12v2a4 4 0 0 1-4 4H4" />
            <path d="M8 22l-4-4 4-4" />
          </svg>
          <Link href={`/community/${p.authorHandle}`} className="hover:underline text-purple-deep">
            {p.authorName} <span className="font-medium text-tan">reposted</span>
          </Link>
        </div>
      )}

      <div className="flex gap-3.5">
        <Link href={`/community/${p.authorHandle}`}>
          {p.authorImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.authorImage}
              alt={`${p.authorName} avatar`}
              className="w-11 h-11 rounded-full object-cover shrink-0 border border-lilac/30 shadow-2xs"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold text-base shrink-0 border border-lilac/40 shadow-2xs">
              {p.authorName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <div className="text-[14.5px]">
            <Link href={`/community/${p.authorHandle}`} className="font-semibold text-purple-deep hover:underline">
              {p.authorName}
            </Link>{" "}
            <Link href={`/community/post/${p.id}`} className="text-tan hover:underline" suppressHydrationWarning>
              @{p.authorHandle} · {relativeTime(p.postedAt)}
            </Link>
          </div>

          {/* User's commentary / post text (if not empty) */}
          {p.body.trim() && (
            <Link href={`/community/post/${p.id}`} className="block">
              <p className="my-1.5 mb-2.5 text-[15px] leading-relaxed text-ink">{p.body}</p>
            </Link>
          )}

          {/* User's own image (if present) with natural aspect-ratio and full-screen view */}
          {p.hasImage && (
            <PostImageMedia
              imageUrl={p.imageUrl}
              imageLabel={p.imageLabel}
              maxHeight="max-h-[560px]"
            />
          )}

          {/* Attached Shared Article with User Opinion */}
          {p.articleId && p.articleSlug && p.articleTitle && (
            <ArticleEmbedCard
              article={{
                title: p.articleTitle,
                slug: p.articleSlug,
                excerpt: p.articleExcerpt,
                imageUrl: p.articleImageUrl,
                imageLabel: p.articleImageLabel,
                category: p.articleCategory,
                author: p.articleAuthor,
              }}
            />
          )}

          {/* Embedded Original Reposted Post */}
          {p.repostOfId && (
            <div className="border border-border/90 rounded-2xl p-3.5 my-2.5 bg-mauve-50/70 hover:bg-mauve-50 transition-colors">
              {p.originalAuthorHandle ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Link href={`/community/${p.originalAuthorHandle}`} className="shrink-0">
                      {p.originalAuthorImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.originalAuthorImage}
                          alt={`${p.originalAuthorName} avatar`}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-[10px]">
                          {p.originalAuthorName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                      )}
                    </Link>
                    <Link
                      href={`/community/${p.originalAuthorHandle}`}
                      className="text-xs font-bold text-purple-deep hover:underline"
                    >
                      {p.originalAuthorName}
                    </Link>
                    <Link
                      href={`/community/post/${p.repostOfId}`}
                      className="text-xs text-tan hover:underline"
                      suppressHydrationWarning
                    >
                      @{p.originalAuthorHandle}
                      {p.originalPostedAt && ` · ${relativeTime(p.originalPostedAt)}`}
                    </Link>
                  </div>

                  <Link href={`/community/post/${p.repostOfId}`} className="block">
                    {p.originalBody && (
                      <p className="text-[14.5px] leading-relaxed text-ink mb-1.5">{p.originalBody}</p>
                    )}
                    {p.originalHasImage && (
                      <PostImageMedia
                        imageUrl={p.originalImageUrl}
                        imageLabel={p.originalImageLabel || "Reposted image"}
                        maxHeight="max-h-[400px]"
                        className="mt-2"
                      />
                    )}
                  </Link>

                  {/* Attached Original Article inside Repost */}
                  {p.originalArticleTitle && p.originalArticleSlug && (
                    <ArticleEmbedCard
                      article={{
                        title: p.originalArticleTitle,
                        slug: p.originalArticleSlug,
                        excerpt: p.originalArticleExcerpt,
                        imageUrl: p.originalArticleImageUrl,
                        imageLabel: p.originalArticleImageLabel,
                        category: p.originalArticleCategory,
                        author: p.originalArticleAuthor,
                      }}
                    />
                  )}
                </>
              ) : (
                <p className="text-xs text-tan italic">Original post is unavailable</p>
              )}
            </div>
          )}

          <div className="flex items-center gap-5 sm:gap-8 text-tan-dark text-sm max-w-[420px] mt-3">
            <Link
              href={`/community/post/${effectivePostId}`}
              className="group inline-flex items-center gap-1.5 py-1 transition-colors duration-200 cursor-pointer select-none text-tan-dark hover:text-purple-deep font-semibold text-sm"
              title="Comments & Replies"
            >
              <svg
                className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-125 group-hover:-rotate-6 stroke-current"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.9}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.636 1.066.526 1.674l-.32 1.776a.75.75 0 00.942.86l2.146-.667c.535-.166 1.11-.082 1.58.223A9.458 9.458 0 0012 20.25z"
                />
              </svg>
              <span className="text-[13.5px] tabular-nums tracking-tight transition-colors duration-200">{p.commentCount}</span>
            </Link>
            <RepostButton
              postId={effectivePostId}
              initialReposted={isReposted}
              initialCount={p.repostCount}
              isLoggedIn={isLoggedIn}
              postAuthorName={effectiveAuthorName}
              postAuthorHandle={effectiveAuthorHandle}
              postAuthorImage={effectiveAuthorImage}
              postBody={effectiveBody}
              postImageUrl={effectiveImageUrl}
            />
            <LikeButton
              postId={effectivePostId}
              initialLiked={isLiked}
              initialCount={p.likeCount}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
