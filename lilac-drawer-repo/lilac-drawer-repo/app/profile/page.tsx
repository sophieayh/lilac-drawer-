import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ImageSlot from "@/components/ImageSlot";
import PostCard from "@/components/community/PostCard";
import PostComposer from "@/components/community/PostComposer";
import { auth } from "@/lib/auth";
import {
  getUserByHandle,
  getPostsByHandle,
  getLikedPostsByUserId,
  getCommentsByUserId,
  getCommunityPostCountByUserId,
  getLikedPostIds,
  getRepostedPostIds,
  formatDate,
} from "@/db/queries";
import EditProfileForm from "@/app/community/[handle]/edit/EditProfileForm";

export const metadata: Metadata = {
  title: "My Profile & Account Settings",
  description: "Manage your profile, account security, and community activity.",
  robots: { index: false, follow: false },
};

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const { tab = "overview" } = await searchParams;

  // If Guest (not logged in), show the dedicated sign-in card
  if (!session?.user) {
    return (
      <>
        <SiteHeader />
        <main className="bg-cream text-purple-deep min-h-screen flex flex-col items-center justify-center px-6 py-20">
          <div className="max-w-[460px] w-full bg-white/85 backdrop-blur-md p-8 md:p-10 rounded-3xl border border-border shadow-[0_12px_36px_rgba(90,47,69,0.08)] text-center">
            <div className="w-16 h-16 rounded-full bg-mauve-100 text-purple-deep flex items-center justify-center mx-auto mb-5 shadow-xs">
              <svg className="w-8 h-8 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </div>
            <h1 className="font-heading text-2xl md:text-3xl mb-3 text-purple-deep font-bold">
              Sign in to your Profile
            </h1>
            <p className="text-tan-dark text-sm mb-8 leading-relaxed">
              Log in to customize your profile, change your password, share reviews, and interact with the Lilac Drawer community.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/login?redirect=/profile"
                className="flex-1 border-[1.5px] border-lilac hover:bg-mauve-50 text-purple-deep py-3 rounded-full font-bold text-xs shadow-xs transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/signup?redirect=/profile"
                className="flex-1 bg-lilac hover:bg-purple-deep text-white py-3 rounded-full font-bold text-xs shadow-[0_4px_14px_rgba(201,163,198,0.4)] transition-all btn-press"
              >
                Create Account
              </Link>
            </div>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const userHandle = (session.user as { handle?: string }).handle || "user";
  const userId = session.user.id;

  const [person, postCount, feedPosts, likedPosts, comments] = await Promise.all([
    getUserByHandle(userHandle),
    getCommunityPostCountByUserId(userId),
    getPostsByHandle(userHandle, 10),
    getLikedPostsByUserId(userId, 10),
    getCommentsByUserId(userId, 10),
  ]);

  const [likedIds, repostedIds] = await Promise.all([
    getLikedPostIds([...feedPosts, ...likedPosts].map((p) => p.id), userId),
    getRepostedPostIds(userId),
  ]);

  const activeTab = tab.toLowerCase();

  return (
    <>
      <SiteHeader />
      <main className="bg-cream text-purple-deep min-h-screen py-10 px-6 md:px-12">
        <div className="max-w-[1100px] mx-auto">
          {/* Profile Hub Header Card */}
          <div className="bg-white rounded-3xl border border-border overflow-hidden mb-8 shadow-[0_8px_30px_rgba(90,47,69,0.06)]">
            {/* Top Cover Banner */}
            <div className="w-full h-36 md:h-48 relative bg-gradient-to-r from-lilac/30 via-mauve-100 to-cream-alt overflow-hidden">
              {person?.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={person.coverImage}
                  alt={`${person?.name || session.user.name} cover`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-end px-6 text-xs text-tan-dark/50 font-medium">
                  @{userHandle}
                </div>
              )}
            </div>

            <div className="p-6 md:p-8 pt-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 pb-6 border-b border-border/80 -mt-12 sm:-mt-14">
                <div className="flex items-end gap-4">
                  {person?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={person.image}
                      alt={person.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md bg-mauve-100 shrink-0"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-lilac/30 text-purple-deep flex items-center justify-center font-bold text-2xl border-4 border-white shadow-md shrink-0">
                      {person?.name ? person.name.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div className="mb-1">
                    <h1 className="font-heading text-2xl font-bold text-purple-deep leading-tight">
                      {person?.name || session.user.name}
                    </h1>
                    <div className="text-xs text-tan font-medium mt-0.5">@{userHandle}</div>
                    <div className="text-xs text-tan-dark mt-0.5">{session.user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 self-stretch sm:self-auto mb-1">
                  <Link
                    href={`/community/${userHandle}`}
                    className="flex-1 sm:flex-initial text-center px-4 py-2.5 rounded-full border border-border hover:border-lilac hover:bg-mauve-50 text-purple-deep text-xs font-bold transition-colors"
                  >
                    View Public Profile →
                  </Link>
                  <Link
                    href="/profile?tab=settings"
                    className="flex-1 sm:flex-initial text-center px-5 py-2.5 rounded-full bg-purple-deep hover:bg-lilac text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Edit Profile
                  </Link>
                </div>
              </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-6 text-center">
              <div className="p-3 bg-mauve-50/60 rounded-2xl border border-border/60">
                <div className="font-heading text-xl md:text-2xl font-bold text-purple-deep">{postCount}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-tan-dark mt-0.5">
                  Posts Created
                </div>
              </div>
              <div className="p-3 bg-mauve-50/60 rounded-2xl border border-border/60">
                <div className="font-heading text-xl md:text-2xl font-bold text-rose">{likedPosts.length}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-tan-dark mt-0.5">
                  Liked Posts
                </div>
              </div>
              <div className="p-3 bg-mauve-50/60 rounded-2xl border border-border/60">
                <div className="font-heading text-xl md:text-2xl font-bold text-purple-deep">{comments.length}</div>
                <div className="text-[11px] uppercase tracking-wider font-semibold text-tan-dark mt-0.5">
                  Replies & Comments
                </div>
              </div>
            </div>
          </div>
        </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-2 mb-6 border-b border-border pb-3 overflow-x-auto no-scrollbar">
            <Link
              href="/profile?tab=overview"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === "overview"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              Overview & Activity
            </Link>
            <Link
              href="/profile?tab=settings"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === "settings"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              Edit Profile & Password
            </Link>
            <Link
              href="/profile?tab=posts"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === "posts"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              My Posts ({postCount})
            </Link>
            <Link
              href="/profile?tab=likes"
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
                activeTab === "likes"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "bg-white text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
              }`}
            >
              My Likes ({likedPosts.length})
            </Link>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
              <div className="bg-white rounded-3xl border border-border p-6 shadow-xs">
                <h2 className="font-heading text-lg font-bold text-purple-deep mb-4 pb-3 border-b border-border">
                  Share New Post
                </h2>
                <PostComposer isLoggedIn={true} />

                <h3 className="font-heading text-base font-bold text-purple-deep mt-8 mb-4 pb-2 border-b border-border">
                  Your Recent Posts
                </h3>
                <div className="divide-y divide-border">
                  {feedPosts.slice(0, 3).map((p) => (
                    <PostCard
                      key={p.id}
                      post={p}
                      isLiked={likedIds.has(p.id)}
                      isReposted={repostedIds.has(p.id)}
                      isLoggedIn={true}
                    />
                  ))}
                  {feedPosts.length === 0 && (
                    <div className="py-8 text-center text-xs text-tan">No posts created yet.</div>
                  )}
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="flex flex-col gap-6">
                <div className="bg-white rounded-3xl border border-border p-6 shadow-xs">
                  <h3 className="font-heading text-sm font-bold text-purple-deep mb-3 uppercase tracking-wide">
                    About Account
                  </h3>
                  {person?.bio && (
                    <p className="text-xs text-ink leading-relaxed mb-4 p-3 bg-mauve-50/70 rounded-xl border border-border">
                      {person.bio}
                    </p>
                  )}
                  <div className="flex flex-col gap-2 text-xs text-tan-dark">
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span>Handle:</span>
                      <span className="font-semibold text-purple-deep">@{userHandle}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span>Email:</span>
                      <span className="font-semibold text-purple-deep">{session.user.email}</span>
                    </div>
                    <div className="flex justify-between py-1.5 border-b border-border/50">
                      <span>Joined:</span>
                      <span className="font-semibold text-purple-deep" suppressHydrationWarning>
                        {person?.createdAt ? formatDate(person.createdAt) : "Member"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-mauve-50/80 rounded-3xl border border-border p-6 shadow-xs">
                  <h3 className="font-heading text-sm font-bold text-rose mb-2 uppercase tracking-wide">
                    Quick Links
                  </h3>
                  <div className="flex flex-col gap-2 text-xs font-semibold">
                    <Link href="/community" className="text-purple-deep hover:text-rose py-1">
                      Browse Community Feed →
                    </Link>
                    <Link href="/deals" className="text-purple-deep hover:text-rose py-1">
                      Explore Deals & Discounts →
                    </Link>
                    <Link href="/blog" className="text-purple-deep hover:text-rose py-1">
                      Read Buying Guides →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Settings (Edit Profile, Change Password, Sign Out) */}
          {activeTab === "settings" && (
            <div className="max-w-[560px] mx-auto">
              <EditProfileForm
                handle={userHandle}
                initialName={person?.name || session.user.name || ""}
                initialBio={person?.bio || ""}
                initialImage={person?.image || session.user.image || ""}
                initialCoverImage={person?.coverImage || ""}
              />
            </div>
          )}

          {/* Tab 3: My Posts */}
          {activeTab === "posts" && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-xs">
              <h2 className="font-heading text-lg font-bold text-purple-deep mb-4 pb-3 border-b border-border">
                All Your Posts ({feedPosts.length})
              </h2>
              <div className="divide-y divide-border">
                {feedPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    isLiked={likedIds.has(p.id)}
                    isReposted={repostedIds.has(p.id)}
                    isLoggedIn={true}
                  />
                ))}
                {feedPosts.length === 0 && (
                  <div className="py-12 text-center text-tan">
                    <p className="font-heading text-base text-purple-deep mb-1">No posts yet</p>
                    <p className="text-xs">Post your thoughts and favorite items in the community feed.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 4: My Likes */}
          {activeTab === "likes" && (
            <div className="bg-white rounded-3xl border border-border p-6 shadow-xs">
              <h2 className="font-heading text-lg font-bold text-rose mb-4 pb-3 border-b border-border">
                Posts You Liked ({likedPosts.length})
              </h2>
              <div className="divide-y divide-border">
                {likedPosts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    isLiked={likedIds.has(p.id)}
                    isReposted={repostedIds.has(p.id)}
                    isLoggedIn={true}
                  />
                ))}
                {likedPosts.length === 0 && (
                  <div className="py-12 text-center text-tan">
                    <p className="font-heading text-base text-purple-deep mb-1">No liked posts yet</p>
                    <p className="text-xs">Browse community posts and click the heart icon to save favorites here.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

