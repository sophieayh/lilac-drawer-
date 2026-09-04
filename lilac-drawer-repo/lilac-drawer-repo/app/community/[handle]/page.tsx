import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import SiteHeader from "@/components/SiteHeader";
import ImageSlot from "@/components/ImageSlot";
import JsonLd from "@/components/JsonLd";
import PostCard from "@/components/community/PostCard";
import LikeButton from "@/components/community/LikeButton";
import RepostButton from "@/components/community/RepostButton";
import { communityNavItems, profileTabs } from "@/lib/data";
import { auth } from "@/lib/auth";
import { siteConfig, absoluteUrl, buildMetadata } from "@/lib/site";
import {
  getUserByHandle,
  getPostsByHandle,
  getMediaPostsByHandle,
  getLikedPostsByUserId,
  getCommentsByUserId,
  getCommunityPostCountByUserId,
  getPeopleSuggestions,
  getLikedPostIds,
  getRepostedPostIds,
  relativeTime,
} from "@/db/queries";

// Reflects the viewer's own like/repost state and which tab they're on, so
// this is rendered per-request rather than cached with ISR.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const person = await getUserByHandle(handle);
  if (!person) return {};

  return buildMetadata({
    title: `${person.name} (@${person.handle})`,
    description: person.bio || `${person.name}'s posts on ${siteConfig.name}.`,
    path: `/community/${person.handle}`,
    type: "profile",
  });
}

type Tab = "Posts" | "Replies" | "Media" | "Likes";

export default async function CommunityProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const { tab: tabParam } = await searchParams;
  const person = await getUserByHandle(handle);
  if (!person) notFound();

  const activeTab: Tab = (profileTabs as readonly string[]).includes(tabParam ?? "")
    ? (tabParam as Tab)
    : "Posts";

  const session = await auth.api.getSession({ headers: await headers() });
  const viewerId = session?.user?.id;
  const isOwnProfile = viewerId === person.id;

  const [postCount, suggestions] = await Promise.all([
    getCommunityPostCountByUserId(person.id),
    getPeopleSuggestions(viewerId, 3),
  ]);

  // Media grid for the sidebar always shows this profile's photos,
  // independent of which tab is selected in the main column.
  const [sidebarPhotos, feedPosts, replies] = await Promise.all([
    getMediaPostsByHandle(person.handle, 6),
    activeTab === "Posts"
      ? getPostsByHandle(person.handle, 20)
      : activeTab === "Media"
        ? getMediaPostsByHandle(person.handle, 20)
        : activeTab === "Likes"
          ? getLikedPostsByUserId(person.id, 20)
          : Promise.resolve([]),
    activeTab === "Replies" ? getCommentsByUserId(person.id, 20) : Promise.resolve([]),
  ]);

  const [likedIds, repostedIds] = viewerId
    ? await Promise.all([
        getLikedPostIds(feedPosts.map((p) => p.id), viewerId),
        getRepostedPostIds(viewerId),
      ])
    : [new Set<number>(), new Set<number>()];

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          dateCreated: person.createdAt.toISOString(),
          mainEntity: {
            "@type": "Person",
            name: person.name,
            alternateName: `@${person.handle}`,
            description: person.bio ?? undefined,
            image: person.image ?? undefined,
            url: absoluteUrl(`/community/${person.handle}`),
          },
        }}
      />
      <SiteHeader />
      <div className="bg-cream text-ink min-h-screen grid lg:grid-cols-[250px_1fr_320px] max-w-[1400px] mx-auto">
        <aside className="hidden lg:flex sticky top-0 h-screen p-7 flex-col justify-between border-r border-border">
          <div>
            <div className="font-heading text-[22px] text-gold px-3 mb-6">Lilac Drawer</div>
            <nav className="flex flex-col gap-1.5">
              {communityNavItems.map((item) => {
                const isProfileLink = item.label === "Profile";
                const isActive = isProfileLink && isOwnProfile;
                return (
                  <Link
                    key={item.label}
                    href={isProfileLink && session?.user ? `/community/${session.user.handle}` : item.href}
                    className={`flex items-center gap-4 px-3 py-3 rounded-full text-[17px] font-medium ${
                      isActive ? "text-purple-deep" : "text-tan-dark hover:bg-mauve-50"
                    }`}
                  >
                    <span className="w-6 h-6 flex items-center justify-center" aria-hidden="true">
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
          <Link
            href="/community"
            className="block text-center bg-lilac text-white rounded-full py-3.5 font-semibold shadow-[0_2px_10px_rgba(201,163,198,0.4)]"
          >
            Post
          </Link>
        </aside>

        <main className="border-r border-border min-h-screen">
          <div className="sticky top-0 bg-cream/90 backdrop-blur px-6 py-3.5 border-b border-border z-10 flex items-center gap-5">
            <Link href="/community" aria-label="Back to community feed" className="text-lg text-ink">
              ←
            </Link>
            <div>
              <div className="font-heading text-[17px] text-purple-deep font-bold">{person.name}</div>
              <div className="text-xs text-tan">
                {postCount} {postCount === 1 ? "post" : "posts"}
              </div>
            </div>
          </div>

          <ImageSlot label={`${person.name} cover photo`} className="w-full h-[180px]" shape="rect" tone="purple" />

          <div className="px-6">
            <div className="flex justify-between items-end -mt-11 mb-3">
              {person.image ? (
                // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided avatar URL; not a site asset next/image can optimize
                <img
                  src={person.image}
                  alt={`${person.name} avatar`}
                  className="w-28 h-28 rounded-full object-cover border-4 border-cream bg-mauve-100"
                />
              ) : (
                <ImageSlot label={`${person.name} avatar`} className="w-28 h-28 border-4 border-cream" shape="circle" tone="mauve" />
              )}
              {isOwnProfile && (
                <Link
                  href={`/community/${person.handle}/edit`}
                  className="border-[1.5px] border-rose text-rose px-5 py-2 rounded-full text-sm font-semibold mt-13"
                >
                  Edit Profile
                </Link>
              )}
            </div>

            <h1 className="font-heading text-xl font-bold text-rose">{person.name}</h1>
            <div className="text-sm text-tan mb-3">@{person.handle}</div>
            {person.bio && <p className="text-[15px] leading-relaxed text-ink mb-3 max-w-[480px]">{person.bio}</p>}
            <div className="text-[13.5px] text-tan mb-4" suppressHydrationWarning>
              Joined {person.createdAt.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>

            <div className="flex gap-8 border-b border-border text-[14.5px] font-semibold">
              {profileTabs.map((t) => (
                <Link
                  key={t}
                  href={t === "Posts" ? `/community/${person.handle}` : `/community/${person.handle}?tab=${t}`}
                  className={`py-3.5 border-b-[2.5px] ${
                    activeTab === t ? "text-rose border-rose" : "text-tan border-transparent hover:text-purple-deep"
                  }`}
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>

          {activeTab === "Replies" ? (
            <>
              {replies.map((r) => (
                <Link
                  key={r.id}
                  href={`/community/post/${r.postId}`}
                  className="block px-6 py-4.5 border-b border-border card-hover"
                >
                  <div className="text-xs text-tan mb-1.5">
                    Replying to <span className="text-purple-deep font-semibold">@{r.postAuthorHandle}</span>
                  </div>
                  <p className="text-[15px] leading-relaxed text-ink mb-1.5">{r.body}</p>
                  <span className="text-xs text-tan">{relativeTime(r.createdAt)} ago</span>
                </Link>
              ))}
              {replies.length === 0 && <p className="text-sm text-tan px-6 py-8">No replies yet.</p>}
            </>
          ) : (
            <>
              {feedPosts.map((p) => (
                <PostCard
                  key={p.id}
                  post={p}
                  isLiked={likedIds.has(p.id)}
                  isReposted={repostedIds.has(p.id)}
                  isLoggedIn={!!viewerId}
                />
              ))}
              {feedPosts.length === 0 && (
                <p className="text-sm text-tan px-6 py-8">
                  {activeTab === "Media" ? "No photos yet." : activeTab === "Likes" ? "No liked posts yet." : "No posts yet."}
                </p>
              )}
            </>
          )}
        </main>

        <aside className="hidden xl:block p-5">
          {sidebarPhotos.length > 0 && (
            <div className="bg-mauve-50 rounded-2xl p-4.5 mb-5">
              <h3 className="font-heading text-[15px] text-purple-deep mb-3.5">Photos</h3>
              <div className="grid grid-cols-3 gap-2">
                {sidebarPhotos.map((p) => (
                  <Link key={p.id} href={`/community/post/${p.id}`}>
                    <ImageSlot label={p.imageLabel ?? "Photo"} className="w-full h-[70px]" shape="rounded" radius={8} tone="pink" />
                  </Link>
                ))}
              </div>
            </div>
          )}
          {suggestions.length > 0 && (
            <div className="bg-mauve-50 rounded-2xl p-4.5">
              <h3 className="font-heading text-[17px] text-purple-deep mb-3.5">Who to Follow</h3>
              {suggestions.map((s) => (
                <Link key={s.id} href={`/community/${s.handle}`} className="flex items-center gap-2.5 py-2.5">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-provided avatar URL
                    <img src={s.image} alt={`${s.name} avatar`} className="w-9.5 h-9.5 rounded-full object-cover shrink-0" />
                  ) : (
                    <ImageSlot label={`${s.name} avatar`} className="w-9.5 h-9.5 shrink-0" shape="circle" tone="purple" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-purple-deep">{s.name}</div>
                    <div className="text-xs text-tan">@{s.handle}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </>
  );
}
