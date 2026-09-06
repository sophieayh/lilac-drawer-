import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import LikeButton from "@/components/community/LikeButton";
import RepostButton from "@/components/community/RepostButton";
import { relativeTime } from "@/db/queries";

export interface CommunityPostItem {
  id: number;
  body: string;
  imageLabel: string | null;
  hasImage: boolean;
  imageUrl?: string | null;
  productId: number | null;
  repostOfId: number | null;
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

  return (
    <article className="px-6 py-4.5 border-b border-border card-hover">
      {/* If it's a bare repost, show a badge header indicating who reposted */}
      {isBareRepost && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-tan mb-2 pl-9">
          <span className="text-sm">↻</span>
          <Link href={`/community/${p.authorHandle}`} className="hover:underline text-tan-dark">
            {p.authorName} reposted
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
              className="w-11 h-11 rounded-full object-cover shrink-0"
            />
          ) : (
            <ImageSlot
              label={`${p.authorName} avatar`}
              className="w-11 h-11 shrink-0"
              shape="circle"
              tone="mauve"
            />
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

          {/* User's own image (if present) */}
          {p.hasImage && (
            <Link href={`/community/post/${p.id}`} className="block mb-3">
              {p.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.imageUrl}
                  alt={p.imageLabel || "Post image"}
                  className="w-full max-h-[440px] rounded-2xl object-cover border border-border bg-mauve-50"
                />
              ) : p.imageLabel ? (
                <ImageSlot
                  label={p.imageLabel}
                  className="w-full h-[260px]"
                  shape="rounded"
                  radius={16}
                  tone="mauve"
                />
              ) : null}
            </Link>
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
                        <ImageSlot
                          label={`${p.originalAuthorName} avatar`}
                          className="w-6 h-6"
                          shape="circle"
                          tone="pink"
                        />
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
                      p.originalImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.originalImageUrl}
                          alt={p.originalImageLabel || "Reposted image"}
                          className="w-full max-h-[300px] rounded-xl object-cover border border-border bg-mauve-50 mt-2"
                        />
                      ) : p.originalImageLabel ? (
                        <ImageSlot
                          label={p.originalImageLabel}
                          className="w-full h-[220px] mt-2"
                          shape="rounded"
                          radius={12}
                          tone="mauve"
                        />
                      ) : null
                    )}
                  </Link>
                </>
              ) : (
                <p className="text-xs text-tan italic">Original post is unavailable</p>
              )}
            </div>
          )}

          <div className="flex gap-10 text-tan text-[13px] max-w-[340px] mt-3">
            <Link href={`/community/post/${p.id}`} className="hover:text-purple-deep flex items-center gap-1.5 transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.636 1.066.526 1.674l-.32 1.776a.75.75 0 00.942.86l2.146-.667c.535-.166 1.11-.082 1.58.223A9.458 9.458 0 0012 20.25z" />
              </svg>
              <span>{p.commentCount}</span>
            </Link>
            <RepostButton
              postId={p.id}
              initialReposted={isReposted}
              initialCount={p.repostCount}
              isLoggedIn={isLoggedIn}
            />
            <LikeButton
              postId={p.id}
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
