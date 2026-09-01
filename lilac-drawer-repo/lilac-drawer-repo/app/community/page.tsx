import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import LikeButton from "@/components/community/LikeButton";
import RepostButton from "@/components/community/RepostButton";
import PostComposer from "@/components/community/PostComposer";
import { communityNavItems } from "@/lib/data";
import { auth } from "@/lib/auth";
import {
  getCommunityFeed,
  getTrends,
  getPeopleSuggestions,
  getLikedPostIds,
  getRepostedPostIds,
  relativeTime,
  formatTrendCount,
} from "@/db/queries";

// This page reflects the viewer's own like/repost state, so it's rendered
// per-request rather than cached with ISR (calling auth's session lookup
// already makes Next.js treat the route as dynamic).
export const metadata: Metadata = {
  title: "Community",
  description: "See what readers are sharing and discussing right now.",
  robots: { index: false, follow: true },
};

export default async function CommunityPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  const userId = session?.user?.id;

  const [communityPosts, communityTrends, communitySuggestions] = await Promise.all([
    getCommunityFeed(),
    getTrends(),
    getPeopleSuggestions(userId),
  ]);

  const [likedIds, repostedIds] = userId
    ? await Promise.all([
        getLikedPostIds(communityPosts.map((p) => p.id), userId),
        getRepostedPostIds(userId),
      ])
    : [new Set<number>(), new Set<number>()];

  return (
    <>
      <SiteHeader />
      <div className="bg-cream text-ink min-h-screen grid lg:grid-cols-[250px_1fr_320px] max-w-[1400px] mx-auto">
      <aside className="hidden lg:flex sticky top-0 h-screen p-7 flex-col justify-between border-r border-border">
        <div>
          <div className="font-heading text-[22px] text-gold px-3 mb-6">Lilac Drawer</div>
          <nav className="flex flex-col gap-1.5">
            {communityNavItems.map((item, i) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-4 px-3 py-3 rounded-full text-[17px] font-medium ${
                  i === 0 ? "text-purple-deep" : "text-tan-dark hover:bg-mauve-50"
                }`}
              >
                <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        <a
          href="#composer"
          className="block text-center bg-lilac text-white rounded-full py-3.5 font-semibold shadow-[0_2px_10px_rgba(201,163,198,0.4)]"
        >
          Post
        </a>
      </aside>

      <main className="border-r border-border min-h-screen">
        <div className="sticky top-0 bg-cream px-6 pt-5 pb-3.5 border-b-[2.5px] border-purple-deep z-10">
          <div className="flex justify-between items-center text-[10.5px] tracking-widest uppercase text-tan mb-1.5">
            <span>Vol. 03 · No. 12</span>
            <span>Lilac Drawer Community Feed</span>
          </div>
          <div className="flex justify-between items-baseline">
            <h1 className="font-heading text-[32px] font-bold text-purple-deep tracking-tight">Community</h1>
            <span className="font-heading text-[13px] text-rose italic">♥ live from the feed</span>
          </div>
        </div>

        <div className="px-6 py-5 border-b border-border">
          <div className="relative">
            <span className="absolute top-2.5 right-3.5 text-[11px] uppercase tracking-wide text-tan bg-cream px-2 py-0.5 rounded-full">
              Ad
            </span>
            <div className="border-[1.5px] border-purple-deep rounded-2xl p-1.5">
              <ImageSlot label="Advertisement banner" className="w-full h-[220px] rounded-[11px]" tone="purple" />
            </div>
          </div>
        </div>

        <PostComposer isLoggedIn={!!userId} />

        {communityPosts.map((p) => (
          <article key={p.id} className="flex gap-3.5 px-6 py-4.5 border-b border-border card-hover">
            <Link href={`/community/${p.authorHandle}`}>
              <ImageSlot label={`${p.authorName} avatar`} className="w-11 h-11 shrink-0" shape="circle" tone="mauve" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px]">
                <Link href={`/community/${p.authorHandle}`} className="font-semibold text-purple-deep">
                  {p.authorName}
                </Link>{" "}
                <Link href={`/community/post/${p.id}`} className="text-tan">
                  @{p.authorHandle} · {relativeTime(p.postedAt)}
                </Link>
              </div>
              <Link href={`/community/post/${p.id}`} className="block">
                {p.body.trim() ? (
                  <p className="my-1.5 mb-3 text-[15px] leading-relaxed">{p.body}</p>
                ) : (
                  <p className="my-1.5 mb-3 text-[15px] leading-relaxed text-tan italic">↻ Reposted a post</p>
                )}
                {p.hasImage && p.imageLabel ? (
                  <ImageSlot label={p.imageLabel} className="w-full h-[260px] mb-3" shape="rounded" radius={16} tone="mauve" />
                ) : null}
              </Link>
              <div className="flex gap-10 text-tan text-[13px] max-w-[340px]">
                <Link href={`/community/post/${p.id}`}>💬 {p.commentCount}</Link>
                <RepostButton postId={p.id} initialReposted={repostedIds.has(p.id)} initialCount={p.repostCount} isLoggedIn={!!userId} />
                <LikeButton postId={p.id} initialLiked={likedIds.has(p.id)} initialCount={p.likeCount} isLoggedIn={!!userId} />
              </div>
            </div>
          </article>
        ))}
      </main>

      <aside className="hidden xl:block p-5">
        <div className="bg-mauve-50 rounded-2xl p-4.5 mb-5 shadow-[0_4px_16px_rgba(46,37,54,0.05)]">
          <label htmlFor="community-search" className="sr-only">
            Search Lilac Drawer
          </label>
          <input
            id="community-search"
            type="search"
            placeholder="Search Lilac Drawer"
            className="w-full border-none bg-white rounded-full px-4 py-2.5 text-sm outline-none"
          />
        </div>
        <div className="bg-mauve-50 rounded-2xl p-4.5 mb-5 border border-border-mauve">
          <h3 className="font-heading text-[15px] text-rose uppercase tracking-wide border-b-[1.5px] border-purple-deep pb-2.5 mb-3.5">
            ✦ Trending Aesthetics
          </h3>
          {communityTrends.map((t) => (
            <div key={t.id} className="block py-2.5 text-ink">
              <div className="text-xs text-tan">{t.category}</div>
              <div className="text-[15px] font-semibold text-purple-deep">{t.tag}</div>
              <div className="text-xs text-tan">{formatTrendCount(t.postCount)} posts</div>
            </div>
          ))}
        </div>
        <div className="bg-mauve-50 rounded-2xl p-4.5">
          <h3 className="font-heading text-[17px] text-purple-deep mb-3.5">Who to Follow</h3>
          {communitySuggestions.map((s) => (
            <Link key={s.id} href={`/community/${s.handle}`} className="flex items-center gap-2.5 py-2.5">
              <ImageSlot label={`${s.name} avatar`} className="w-9.5 h-9.5 shrink-0" shape="circle" tone="purple" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-purple-deep">{s.name}</div>
                <div className="text-xs text-tan">@{s.handle}</div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
    </>
  );
}
