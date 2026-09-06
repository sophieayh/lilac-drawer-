import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import CommunityAdBanner from "@/components/community/CommunityAdBanner";
import { auth } from "@/lib/auth";
import {
  getCommunityFeed,
  getTrends,
  getPeopleSuggestions,
  getLikedPostIds,
  getRepostedPostIds,
  getLatestPosts,
  getHomeFeaturedDeals,
  getActiveBanners,
  formatPrice,
  formatDate,
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

  const [communityPosts, communityTrends, communitySuggestions, latestArticles, featuredProducts, communityBanners] =
    await Promise.all([
      getCommunityFeed(20),
      getTrends(),
      getPeopleSuggestions(userId, 3),
      getLatestPosts(3),
      getHomeFeaturedDeals(),
      getActiveBanners("community_banner"),
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
      <div className="bg-cream text-ink min-h-screen">
        <div className="grid lg:grid-cols-[1fr_360px] gap-8 px-6 md:px-12 py-6 max-w-[1400px] mx-auto">
          {/* Main Community Feed Column */}
          <main className="min-w-0 border-r-0 lg:border-r border-border lg:pr-8">
            <div className="sticky top-0 bg-cream/95 backdrop-blur-xs pt-2 pb-3.5 border-b-[2.5px] border-purple-deep z-10">
              <div className="flex justify-between items-center text-[10.5px] tracking-widest uppercase text-tan mb-1.5">
                <span>Vol. 03 · No. 12</span>
                <span>Lilac Drawer Community Feed</span>
              </div>
              <div className="flex justify-between items-baseline">
                <h1 className="font-heading text-[30px] md:text-[34px] font-bold text-purple-deep tracking-tight">
                  Community
                </h1>
                <span className="font-heading text-[13px] text-rose italic">live from the feed</span>
              </div>
            </div>

            {/* Dynamic Community Advertisement Banner with Infinite Auto-Scroll */}
            <CommunityAdBanner banners={communityBanners} />

            {/* Post Composer */}
            <PostComposer isLoggedIn={!!userId} />

            {/* Feed Posts */}
            <div className="divide-y divide-border">
              {communityPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  isLiked={likedIds.has(p.id)}
                  isReposted={repostedIds.has(p.id)}
                  isLoggedIn={!!userId}
                />
              ))}

              {communityPosts.length === 0 && (
                <div className="text-center py-16 text-tan-dark">
                  <p className="font-heading text-lg text-purple-deep mb-2">No posts yet</p>
                  <p className="text-sm">Be the first to share an aesthetic find with the community!</p>
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar: Curated Mix of Articles, Products, and Community Voices */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
            {/* 1. Curated Articles & Buying Guides */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h3 className="font-heading text-[15px] font-bold text-purple-deep uppercase tracking-wide">
                  Must-Read Guides
                </h3>
                <Link href="/blog" className="text-xs font-semibold text-rose hover:underline">
                  All articles →
                </Link>
              </div>

              <div className="flex flex-col gap-3.5">
                {latestArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="flex gap-3 group card-hover p-2.5 rounded-xl hover:bg-mauve-50 transition-all"
                  >
                    <ImageSlot
                      label={article.imageLabel}
                      imageUrl={article.imageUrl}
                      className="w-16 h-16 shrink-0 shadow-xs"
                      shape="rounded"
                      radius={10}
                      tone="mauve"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose">
                        {article.topicLabel || article.category}
                      </span>
                      <h4 className="text-[13px] font-semibold text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug mt-0.5">
                        {article.title}
                      </h4>
                      <span className="text-[11px] text-tan mt-1 block">
                        {formatDate(article.publishedAt)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 2. Curated Trending Products & Top Picks */}
            <div className="bg-white rounded-2xl p-5 border border-border shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-border">
                <h3 className="font-heading text-[15px] font-bold text-rose uppercase tracking-wide">
                  Top Tested Picks
                </h3>
                <Link href="/deals" className="text-xs font-semibold text-purple-deep hover:text-rose hover:underline">
                  View deals →
                </Link>
              </div>

              <div className="flex flex-col gap-3">
                {featuredProducts.map((prod) => (
                  <Link
                    key={prod.id}
                    href={`/deals/${prod.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-mauve-50/70 hover:bg-mauve-50 group card-hover border border-border/70"
                  >
                    <ImageSlot
                      label={prod.imageLabel}
                      imageUrl={prod.imageUrl}
                      className="w-14 h-14 shrink-0 shadow-xs"
                      shape="rounded"
                      radius={10}
                      tone="pink"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-purple-deep group-hover:text-rose transition-colors line-clamp-1">
                        {prod.name}
                      </div>
                      <div className="text-[11px] text-tan-dark line-clamp-1 mt-0.5">
                        {prod.subtitle || prod.category}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold text-rose">
                          {formatPrice(prod.priceCents)}
                        </span>
                        {prod.compareAtPriceCents ? (
                          <span className="text-[11px] text-tan line-through">
                            {formatPrice(prod.compareAtPriceCents)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* 3. Community Voices / Who to Follow */}
            {communitySuggestions.length > 0 && (
              <div className="bg-mauve-50/80 rounded-2xl p-5 border border-border shadow-xs">
                <h3 className="font-heading text-[14px] font-bold text-purple-deep mb-3 uppercase tracking-wide">
                  Community Voices
                </h3>
                <div className="flex flex-col gap-2.5">
                  {communitySuggestions.map((s) => (
                    <Link
                      key={s.id}
                      href={`/community/${s.handle}`}
                      className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-white transition-colors group"
                    >
                      {s.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.image}
                          alt={`${s.name} avatar`}
                          className="w-9 h-9 rounded-full object-cover border border-lilac shrink-0"
                        />
                      ) : (
                        <ImageSlot label={`${s.name} avatar`} className="w-9 h-9 shrink-0" shape="circle" tone="purple" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-purple-deep group-hover:text-rose transition-colors truncate">
                          {s.name}
                        </div>
                        <div className="text-[11px] text-tan truncate">@{s.handle}</div>
                      </div>
                      <span className="text-xs font-semibold text-rose group-hover:translate-x-0.5 transition-transform">
                        →
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
