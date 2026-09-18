import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import LikeButton from "@/components/community/LikeButton";
import RepostButton from "@/components/community/RepostButton";
import CommentForm from "@/components/community/CommentForm";
import ArticleEmbedCard from "@/components/community/ArticleEmbedCard";
import { auth } from "@/lib/auth";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import { getPostById, getCommentsForPost, hasUserLikedPost, hasUserRepostedPost, relativeTime } from "@/db/queries";

// This page reflects the viewer's own like/repost state, so it's rendered
// per-request rather than cached with ISR.

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostById(Number(id));
  if (!post) return {};

  const original = post.repostOfId ? await getPostById(post.repostOfId) : null;
  const isBareRepost = !!original && post.body.trim().length === 0;

  const title = isBareRepost
    ? `${post.authorName} reposted ${original.authorName} on Lilac Drawer`
    : `${post.authorName} on Lilac Drawer: "${post.body.slice(0, 80)}${post.body.length > 80 ? "…" : ""}"`;
  const description = isBareRepost
    ? original.body.slice(0, 155)
    : post.body.slice(0, 155);

  const metadata = buildMetadata({
    title,
    description,
    path: `/community/post/${post.id}`,
    type: "article",
  });

  // A bare repost (no added commentary) has no content of its own beyond
  // what the original post's page already provides — indexing it would be
  // a near-duplicate of that page, so it's excluded from search while
  // staying fully reachable and linked for visitors.
  if (isBareRepost) {
    metadata.robots = { index: false, follow: true };
  }
  return metadata;
}

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const post = await getPostById(postId);
  if (!post) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [postComments, originalPost, liked, reposted] = await Promise.all([
    getCommentsForPost(post.id),
    post.repostOfId ? getPostById(post.repostOfId) : Promise.resolve(null),
    userId ? hasUserLikedPost(post.id, userId) : Promise.resolve(false),
    userId ? hasUserRepostedPost(post.id, userId) : Promise.resolve(false),
  ]);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "DiscussionForumPosting",
          headline: (post.body.trim() || originalPost?.body || "").slice(0, 110),
          text: post.body,
          datePublished: post.postedAt.toISOString(),
          author: { "@type": "Person", name: post.authorName, url: absoluteUrl(`/community/${post.authorHandle}`) },
          publisher: { "@type": "Organization", name: siteConfig.name },
          interactionStatistic: [
            { "@type": "InteractionCounter", interactionType: "https://schema.org/CommentAction", userInteractionCount: post.commentCount },
            { "@type": "InteractionCounter", interactionType: "https://schema.org/LikeAction", userInteractionCount: post.likeCount },
            { "@type": "InteractionCounter", interactionType: "https://schema.org/ShareAction", userInteractionCount: post.repostCount },
          ],
          comment: postComments.map((c) => ({
            "@type": "Comment",
            text: c.body,
            dateCreated: c.createdAt.toISOString(),
            author: { "@type": "Person", name: c.authorName },
          })),
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
            { "@type": "ListItem", position: 2, name: "Community", item: absoluteUrl("/community") },
            { "@type": "ListItem", position: 3, name: `${post.authorName}'s post`, item: absoluteUrl(`/community/post/${post.id}`) },
          ],
        }}
      />
      <SiteHeader />
      <main className="bg-cream text-ink min-h-screen">
        <div className="max-w-[640px] mx-auto px-6 py-8">
          <nav aria-label="Breadcrumb" className="text-xs text-tan mb-6">
            <Link href="/community" className="hover:text-rose">
              Community
            </Link>{" "}
            / <span className="text-tan-dark">Post</span>
          </nav>

          <article className="border border-border rounded-2xl p-6">
            <h1 className="sr-only">
              {post.authorName}&apos;s post on {siteConfig.name}
            </h1>
            <div className="flex gap-3.5 mb-3">
              <Link href={`/community/${post.authorHandle}`}>
                {post.authorImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.authorImage}
                    alt={`${post.authorName} avatar`}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border border-lilac/30"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold text-lg shrink-0 border border-lilac/40 shadow-2xs">
                    {post.authorName?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                )}
              </Link>
              <div>
                <Link href={`/community/${post.authorHandle}`} className="font-semibold text-purple-deep block">
                  {post.authorName}
                </Link>
                <span className="text-tan text-sm">@{post.authorHandle}</span>
              </div>
            </div>

            {originalPost && (
              <div className="border border-border rounded-xl p-3.5 mb-3 bg-mauve-50">
                <div className="text-xs text-tan mb-1.5 flex items-center gap-1.5">
                  <span>Repost of</span>{" "}
                  <Link href={`/community/${originalPost.authorHandle}`} className="font-semibold text-purple-deep hover:underline">
                    {originalPost.authorName}
                  </Link>
                  <span className="text-tan text-xs">@{originalPost.authorHandle}</span>
                </div>
                <Link href={`/community/post/${originalPost.id}`} className="block">
                  <p className="text-sm text-tan-dark leading-relaxed">{originalPost.body}</p>
                  {originalPost.hasImage && (
                    originalPost.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={originalPost.imageUrl}
                        alt={originalPost.imageLabel || "Reposted image"}
                        className="w-full max-h-[300px] object-cover rounded-xl border border-border bg-mauve-50 mt-2"
                      />
                    ) : originalPost.imageLabel ? (
                      <ImageSlot label={originalPost.imageLabel} className="w-full h-[220px] mt-2" shape="rounded" radius={12} tone="mauve" />
                    ) : null
                  )}
                </Link>

                {originalPost.articleTitle && originalPost.articleSlug && (
                  <ArticleEmbedCard
                    article={{
                      title: originalPost.articleTitle,
                      slug: originalPost.articleSlug,
                      excerpt: originalPost.articleExcerpt,
                      imageUrl: originalPost.articleImageUrl,
                      imageLabel: originalPost.articleImageLabel,
                      category: originalPost.articleCategory,
                      author: originalPost.articleAuthor,
                    }}
                  />
                )}
              </div>
            )}

            <p className="text-[17px] leading-relaxed mb-4">{post.body}</p>
            {post.hasImage && (
              post.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.imageUrl}
                  alt={post.imageLabel || "Post image"}
                  className="w-full max-h-[500px] object-cover rounded-2xl border border-border bg-mauve-50 mb-4"
                />
              ) : post.imageLabel ? (
                <ImageSlot label={post.imageLabel} className="w-full h-[320px] mb-4" shape="rounded" radius={16} tone="mauve" />
              ) : null
            )}

            {/* Attached Shared Article with Opinion */}
            {post.articleId && post.articleSlug && post.articleTitle && (
              <div className="mb-4">
                <ArticleEmbedCard
                  article={{
                    title: post.articleTitle,
                    slug: post.articleSlug,
                    excerpt: post.articleExcerpt,
                    imageUrl: post.articleImageUrl,
                    imageLabel: post.articleImageLabel,
                    category: post.articleCategory,
                    author: post.articleAuthor,
                  }}
                />
              </div>
            )}

            <div className="text-xs text-tan mb-4" suppressHydrationWarning>{relativeTime(post.postedAt)} ago</div>
            <div className="flex items-center gap-5 sm:gap-8 text-tan-dark text-sm border-t border-border pt-3.5">
              <a
                href="#comments"
                className="group inline-flex items-center gap-1.5 py-1 transition-colors duration-200 cursor-pointer select-none text-tan-dark hover:text-purple-deep font-semibold text-sm"
                title="Jump to Comments"
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
                <span className="text-[13.5px] tabular-nums tracking-tight transition-colors duration-200">{post.commentCount}</span>
              </a>
              <RepostButton postId={post.id} initialReposted={reposted} initialCount={post.repostCount} isLoggedIn={!!userId} />
              <LikeButton postId={post.id} initialLiked={liked} initialCount={post.likeCount} isLoggedIn={!!userId} />
            </div>
          </article>

          <CommentForm postId={post.id} isLoggedIn={!!userId} />

          <section id="comments" className="mt-6 scroll-mt-6">
            <h2 className="font-heading text-lg text-purple-deep mb-4">
              {postComments.length} {postComments.length === 1 ? "Comment" : "Comments"}
            </h2>
            {postComments.map((c) => (
              <div key={c.id} className="flex gap-3 py-3.5 border-b border-border">
                <div className="w-9 h-9 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-xs shrink-0 border border-lilac/40">
                  {c.authorName?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div>
                  <div className="text-sm">
                    <Link href={`/community/${c.authorHandle}`} className="font-semibold text-purple-deep">
                      {c.authorName}
                    </Link>{" "}
                    <span className="text-tan text-xs" suppressHydrationWarning>{relativeTime(c.createdAt)} ago</span>
                  </div>
                  <p className="text-[14.5px] mt-1">{c.body}</p>
                </div>
              </div>
            ))}
            {postComments.length === 0 && <p className="text-sm text-tan">No comments yet.</p>}
          </section>
        </div>
      </main>
    </>
  );
}
