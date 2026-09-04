"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updatePostPlacement } from "@/lib/actions";
import type { posts } from "@/db/schema";

type Post = typeof posts.$inferSelect;

interface PlacementZoneConfig {
  key: keyof Post;
  title: string;
  badge: string;
  description: string;
  recommendedCount: number;
}

const ZONES: PlacementZoneConfig[] = [
  {
    key: "isHomeSpread",
    title: "Home — Editorial Spread (Top Box)",
    badge: "Homepage Top",
    description: "Featured 2-article split box at the top of the homepage.",
    recommendedCount: 2,
  },
  {
    key: "isNewHome",
    title: "Home — New + Updated",
    badge: "Homepage Sidebar",
    description: "Articles in the 'New + Updated' sidebar list under Today's Picks.",
    recommendedCount: 4,
  },
  {
    key: "isHomeReview",
    title: "Home — Latest Reviews",
    badge: "Homepage Reviews",
    description: "Featured review cards strip across the middle of the homepage.",
    recommendedCount: 3,
  },
  {
    key: "isHomeGuide",
    title: "Home — Featured Buying Guide (Banner)",
    badge: "Homepage Guide",
    description: "Large featured buying guide banner across the lower section of the homepage.",
    recommendedCount: 1,
  },
  {
    key: "isHomePreview",
    title: "Home — From the Blog",
    badge: "Homepage Blog",
    description: "The 3 preview cards in the 'From the Blog' row near the footer.",
    recommendedCount: 3,
  },
  {
    key: "isRecentBlog",
    title: "Blog — Latest Posts",
    badge: "Blog Hero Grid",
    description: "Main highlighted articles at the top of the /blog page.",
    recommendedCount: 4,
  },
  {
    key: "isSideStory",
    title: "Blog — Side Column",
    badge: "Blog Sidebar",
    description: "Side-column articles on the /blog page.",
    recommendedCount: 2,
  },
  {
    key: "isDealsPreview",
    title: "Deals — Latest Blog",
    badge: "Deals Page",
    description: "Articles featured at the bottom of the /deals page.",
    recommendedCount: 3,
  },
];

export default function PlacementBoard({ initialPosts, hideHeader = false }: { initialPosts: Post[]; hideHeader?: boolean }) {
  const [postsList, setPostsList] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [draggedPostId, setDraggedPostId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = ["ALL", ...Array.from(new Set(initialPosts.map((p) => p.category)))];

  const filteredPosts = postsList.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === "ALL" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function handleTogglePlacement(postId: number, key: string, nextValue: boolean) {
    // Optimistic UI update
    setPostsList((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, [key]: nextValue } : p))
    );

    startTransition(async () => {
      try {
        await updatePostPlacement(postId, key, nextValue);
      } catch (err) {
        console.error("Failed to update placement:", err);
        // Revert on error
        setPostsList(initialPosts);
      }
    });
  }

  function handleDragStart(e: React.DragEvent, postId: number) {
    setDraggedPostId(postId);
    e.dataTransfer.setData("text/plain", String(postId));
    e.dataTransfer.effectAllowed = "copyMove";
  }

  function handleDragEnd() {
    setDraggedPostId(null);
    setDragOverZone(null);
  }

  function handleDragOver(e: React.DragEvent, zoneKey: string) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (dragOverZone !== zoneKey) {
      setDragOverZone(zoneKey);
    }
  }

  function handleDrop(e: React.DragEvent, zoneKey: string) {
    e.preventDefault();
    setDragOverZone(null);
    const postIdStr = e.dataTransfer.getData("text/plain");
    const postId = Number(postIdStr) || draggedPostId;
    if (!postId) return;

    handleTogglePlacement(postId, zoneKey, true);
    setDraggedPostId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
          <div>
            <h1 className="font-heading text-2xl text-purple-deep">Site Placements & Layout</h1>
            <p className="text-sm text-tan-dark mt-1">
              Drag and drop articles into site sections to control where they appear across the pages.
            </p>
          </div>
          {isPending && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose bg-pink-100/50 px-3 py-1.5 rounded-full self-start">
              <span className="inline-block animate-spin">✦</span> Saving changes…
            </div>
          )}
        </div>
      )}

      {hideHeader && isPending && (
        <div className="flex items-center gap-2 text-xs font-semibold text-rose bg-pink-100/50 px-3 py-1.5 rounded-full self-start">
          <span className="inline-block animate-spin">✦</span> Saving changes…
        </div>
      )}

      <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left Column: Draggable Articles Pool */}
        <div className="bg-white rounded-2xl border border-border p-4.5 shadow-sm sticky top-6 max-h-[calc(100vh-60px)] flex flex-col">
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-base text-purple-deep flex items-center gap-2">
                <span>All Articles</span>
                <span className="text-xs bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full font-bold">
                  {filteredPosts.length}
                </span>
              </h2>
              <span className="text-[11px] text-tan uppercase tracking-wide">Drag to assign ⠿</span>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles…"
              className="w-full border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-lilac bg-cream/30"
            />
          </div>

          {/* Category Filter Chips */}
          <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-2 no-scrollbar">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                className={`text-[11px] px-2.5 py-1 rounded-full whitespace-nowrap font-medium transition-colors ${
                  activeCategory === c
                    ? "bg-purple-deep text-white font-semibold"
                    : "bg-mauve-50 text-tan-dark hover:bg-mauve-100"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Articles List */}
          <div className="overflow-y-auto pr-1 flex flex-col gap-2 flex-1 divide-y divide-border/40">
            {filteredPosts.map((p) => {
              const activePlacements = ZONES.filter((z) => Boolean(p[z.key]));
              const isBeingDragged = draggedPostId === p.id;

              return (
                <div
                  key={p.id}
                  draggable={true}
                  onDragStart={(e) => handleDragStart(e, p.id)}
                  onDragEnd={handleDragEnd}
                  className={`pt-2.5 first:pt-0 group p-2.5 rounded-xl border border-transparent hover:border-lilac/50 hover:bg-mauve-50/50 cursor-grab active:cursor-grabbing transition-all ${
                    isBeingDragged ? "opacity-40 scale-95 border-dashed border-lilac" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className="text-tan-dark/50 group-hover:text-purple-deep text-sm select-none mt-1">⠿</span>
                    {p.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.imageUrl}
                        alt=""
                        className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-pink-100/60 border border-border shrink-0 flex items-center justify-center text-[10px] text-purple-deep font-bold">
                        {p.category.slice(0, 3)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-purple-deep leading-snug line-clamp-2">
                        {p.title}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] uppercase tracking-wider font-bold text-rose">
                          {p.category}
                        </span>
                        {p.topicLabel && (
                          <span className="text-[10px] text-tan-dark">· {p.topicLabel}</span>
                        )}
                      </div>

                      {/* Active Placement Badges */}
                      {activePlacements.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {activePlacements.map((z) => (
                            <span
                              key={z.key}
                              className="text-[9.5px] bg-mauve-100 text-purple-deep font-medium px-1.5 py-0.5 rounded border border-border/80"
                            >
                              {z.badge}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredPosts.length === 0 && (
              <div className="text-center py-8 text-xs text-tan">No articles found.</div>
            )}
          </div>
        </div>

        {/* Right Area: Placement Drop Zones (Large Cards) */}
        <div className="grid md:grid-cols-2 gap-5">
          {ZONES.map((zone) => {
            const assignedArticles = postsList.filter((p) => Boolean(p[zone.key]));
            const isOver = dragOverZone === zone.key;
            const isFull = assignedArticles.length >= zone.recommendedCount;

            return (
              <div
                key={zone.key}
                onDragOver={(e) => handleDragOver(e, zone.key)}
                onDragLeave={() => setDragOverZone(null)}
                onDrop={(e) => handleDrop(e, zone.key)}
                className={`rounded-2xl border bg-white p-5 transition-all flex flex-col justify-between shadow-sm min-h-[260px] ${
                  isOver
                    ? "border-lilac bg-mauve-50/80 ring-2 ring-lilac/40 scale-[1.01]"
                    : "border-border hover:border-lilac/40"
                }`}
              >
                <div>
                  {/* Zone Header */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-rose bg-pink-100/70 px-2 py-0.5 rounded-full">
                        {zone.badge}
                      </span>
                      <h3 className="font-heading text-base text-purple-deep mt-1.5 font-bold">
                        {zone.title}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          assignedArticles.length === 0
                            ? "bg-sand text-tan-dark"
                            : isFull
                              ? "bg-mauve-100 text-purple-deep"
                              : "bg-pink-100 text-rose"
                        }`}
                      >
                        {assignedArticles.length} / {zone.recommendedCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-tan-dark mb-4 leading-relaxed">{zone.description}</p>

                  {/* Assigned Articles in this Zone */}
                  <div className="flex flex-col gap-2 mb-3">
                    {assignedArticles.map((article, idx) => (
                      <div
                        key={article.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-mauve-50/70 border border-border group hover:bg-mauve-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-heading font-bold text-purple-deep/40 w-4 text-center">
                            {idx + 1}
                          </span>
                          {article.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={article.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-pink-100 shrink-0 flex items-center justify-center text-[9px] font-bold text-purple-deep">
                              {article.category.slice(0, 3)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/articles/${article.id}`}
                              className="text-xs font-semibold text-purple-deep hover:underline truncate block"
                            >
                              {article.title}
                            </Link>
                            <span className="text-[10px] text-tan">
                              {article.topicLabel || article.category}
                            </span>
                          </div>
                        </div>

                        {/* Quick Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlacement(article.id, zone.key, false)}
                          title={`Remove from ${zone.badge}`}
                          className="w-6 h-6 rounded-full text-tan hover:text-red-600 hover:bg-red-50 flex items-center justify-center text-xs font-bold transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Drop Target Box */}
                <div
                  className={`border-2 border-dashed rounded-xl p-3.5 text-center transition-colors ${
                    isOver
                      ? "border-lilac bg-lilac/10 text-purple-deep font-semibold text-xs"
                      : "border-border/80 text-tan text-xs hover:border-lilac hover:text-purple-deep"
                  }`}
                >
                  {isOver ? (
                    <span>Release to drop article here 🎯</span>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>⬇ Drop article card here</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
