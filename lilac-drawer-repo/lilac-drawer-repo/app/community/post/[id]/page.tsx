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
                <ImageSlot label={`${post.authorName} avatar`} className="w-12 h-12 shrink-0" shape="circle" tone="mauve" />
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
            <div className="text-xs text-tan mb-4" suppressHydrationWarning>{relativeTime(post.postedAt)} ago</div>
            <div className="flex gap-8 text-tan text-sm border-t border-border pt-3.5">
              <span>💬 {post.commentCount}</span>
              <RepostButton postId={post.id} initialReposted={reposted} initialCount={post.repostCount} isLoggedIn={!!userId} />
              <LikeButton postId={post.id} initialLiked={liked} initialCount={post.likeCount} isLoggedIn={!!userId} />
            </div>
          </article>

          <CommentForm postId={post.id} isLoggedIn={!!userId} />

          <section className="mt-6">
            <h2 className="font-heading text-lg text-purple-deep mb-4">
              {postComments.length} {postComments.length === 1 ? "Comment" : "Comments"}
            </h2>
            {postComments.map((c) => (
              <div key={c.id} className="flex gap-3 py-3.5 border-b border-border">
                <ImageSlot label={`${c.authorName} avatar`} className="w-9 h-9 shrink-0" shape="circle" tone="pink" />
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
