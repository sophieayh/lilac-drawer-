"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatDate } from "@/lib/format";
import type { posts as postsSchema } from "@/db/schema";

type Post = typeof postsSchema.$inferSelect;

interface Props {
  title: string;
  subtitle: string;
  badge: string;
  collectionType: "all" | "reviews" | "care" | "guides";
  initialPosts: Post[];
}

export default function BlogArticleExplorer({
  title,
  subtitle,
  badge,
  collectionType,
  initialPosts,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title-asc" | "author-asc">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Extract unique categories and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialPosts) {
      const cat = p.category ? p.category.toUpperCase() : "GENERAL";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [initialPosts]);

  const categories = useMemo(() => Object.keys(categoryCounts).sort(), [categoryCounts]);

  // Filtered and Sorted Articles
  const filteredPosts = useMemo(() => {
    return initialPosts
      .filter((post) => {
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesTitle = post.title.toLowerCase().includes(q);
          const matchesExcerpt = post.excerpt.toLowerCase().includes(q);
          const matchesCat = post.category.toLowerCase().includes(q);
          const matchesAuthor = post.author.toLowerCase().includes(q);
          const matchesTopic = post.topicLabel ? post.topicLabel.toLowerCase().includes(q) : false;
          if (!matchesTitle && !matchesExcerpt && !matchesCat && !matchesAuthor && !matchesTopic) {
            return false;
          }
        }

        if (selectedCategory !== "all" && post.category.toUpperCase() !== selectedCategory) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
        }
        if (sortBy === "oldest") {
          return new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime();
        }
        if (sortBy === "title-asc") {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === "author-asc") {
          return a.author.localeCompare(b.author);
        }
        return 0;
      });
  }, [initialPosts, searchQuery, selectedCategory, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== "" || selectedCategory !== "all";

  function resetAllFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("newest");
  }

  const collectionTabs = [
    { label: "All Articles", href: "/blog/all", key: "all" },
    { label: "Reviews", href: "/blog/reviews", key: "reviews" },
    { label: "Care Guides", href: "/blog/care", key: "care" },
    { label: "Buying Guides", href: "/blog/guides", key: "guides" },
    { label: "Blog Magazine", href: "/blog", key: "magazine" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Banner & Collection Switcher */}
      <div className="bg-mauve-50/80 border border-border rounded-3xl p-6 md:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-[780px]">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-tan mb-3">
            <Link href="/" className="hover:text-purple-deep">
              Home
            </Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-purple-deep">
              Blog
            </Link>
            <span>/</span>
            <span className="text-purple-deep font-semibold">{title}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-rose text-white text-xs font-bold px-3 py-1 rounded-full mb-3 shadow-xs">
            <span>{badge}</span>
          </div>

          <h1 className="font-heading text-3xl md:text-5xl font-bold text-purple-deep leading-tight mb-3">
            {title}
          </h1>

          <p className="text-sm md:text-base text-tan-dark leading-relaxed mb-6">
            {subtitle}
          </p>

          {/* Quick Collection Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {collectionTabs.map((tab) => {
              const isActive = collectionType === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-purple-deep text-white shadow-sm"
                      : "bg-white border border-border text-tan-dark hover:text-purple-deep hover:bg-mauve-100"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Control Bar: Search, Category Chips & Sort */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-[var(--shadow-card)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, topic, author, or keywords..."
            className="w-full pl-10 pr-10 py-2.5 bg-mauve-50/50 border border-border rounded-xl text-sm text-purple-deep placeholder:text-tan outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
          />
          <svg
            className="w-4 h-4 text-tan absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-tan hover:text-purple-deep text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Controls: Categories & Sort Dropdown */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto flex-wrap">
          {/* Categories */}
          {categories.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-purple-deep text-white font-bold"
                    : "bg-mauve-50 text-purple-deep hover:bg-mauve-100"
                }`}
              >
                All Topics ({initialPosts.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === cat
                      ? "bg-purple-deep text-white font-bold"
                      : "bg-mauve-50 text-purple-deep hover:bg-mauve-100"
                  }`}
                >
                  {cat} ({categoryCounts[cat]})
                </button>
              ))}
            </div>
          )}

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 bg-mauve-50/50 border border-border rounded-xl text-xs font-semibold text-purple-deep outline-none focus:border-rose cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="title-asc">Title (A-Z)</option>
              <option value="author-asc">Author (A-Z)</option>
            </select>
          </div>

          {/* View Mode */}
          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-mauve-50/50">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-purple-deep text-white" : "text-tan hover:text-purple-deep"
              }`}
              aria-label="Grid View"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "list" ? "bg-purple-deep text-white" : "text-tan hover:text-purple-deep"
              }`}
              aria-label="List View"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Results Header & Active Chips */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="text-xs text-tan-dark font-medium">
          Showing <span className="font-bold text-purple-deep">{filteredPosts.length}</span> of{" "}
          <span>{initialPosts.length}</span> articles
        </div>

        {hasActiveFilters && (
          <div className="flex items-center gap-2 flex-wrap">
            {searchQuery && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep text-[11px] font-bold px-2.5 py-1 rounded-full">
                &ldquo;{searchQuery}&rdquo;
                <button onClick={() => setSearchQuery("")} className="cursor-pointer">✕</button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep text-[11px] font-bold px-2.5 py-1 rounded-full">
                Topic: {selectedCategory}
                <button onClick={() => setSelectedCategory("all")} className="cursor-pointer">✕</button>
              </span>
            )}
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose hover:underline ml-1 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* GRID VIEW */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-3xl border border-border overflow-hidden shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Image Banner */}
                <div className="relative aspect-[16/10] bg-mauve-50/60 overflow-hidden">
                  <ImageSlot
                    imageUrl={post.imageUrl}
                    label={post.imageLabel || post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    shape="rounded"
                    radius={0}
                    tone="mauve"
                  />
                  <span className="absolute top-3 left-3 bg-purple-deep text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs">
                    {post.topicLabel || post.category}
                  </span>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="text-[11px] text-gold font-semibold mb-2">
                    {formatDate(post.publishedAt)} • By {post.author}
                  </div>

                  <h3 className="font-heading text-lg font-bold text-purple-deep group-hover:text-rose transition-colors leading-snug mb-2.5 line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-xs md:text-sm text-tan-dark line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </div>

              {/* Read button */}
              <div className="p-6 pt-0">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose group-hover:text-purple-deep transition-colors">
                  <span>Read Full Article</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && (
        <div className="flex flex-col gap-4">
          {filteredPosts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="bg-white rounded-3xl border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group"
            >
              {/* Thumbnail */}
              <div className="relative w-full md:w-60 h-44 shrink-0 rounded-2xl overflow-hidden bg-mauve-50/60">
                <ImageSlot
                  imageUrl={post.imageUrl}
                  label={post.imageLabel || post.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  shape="rounded"
                  radius={16}
                  tone="mauve"
                />
                <span className="absolute top-2.5 left-2.5 bg-purple-deep text-white text-[9.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
                  {post.topicLabel || post.category}
                </span>
              </div>

              {/* Middle Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <div className="text-[11px] text-gold font-semibold">
                  {formatDate(post.publishedAt)} • By {post.author}
                </div>

                <h3 className="font-heading text-lg font-bold text-purple-deep group-hover:text-rose transition-colors leading-snug">
                  {post.title}
                </h3>

                <p className="text-xs text-tan-dark line-clamp-2 leading-relaxed">
                  {post.excerpt}
                </p>
              </div>

              {/* Action Button */}
              <div className="w-full md:w-auto shrink-0 flex items-center md:items-end justify-end border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-5">
                <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-deep text-white text-xs font-bold group-hover:bg-rose transition-colors">
                  <span>Read Article</span>
                  <span>→</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {filteredPosts.length === 0 && (
        <div className="bg-white border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep mb-2">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-heading text-xl font-bold text-purple-deep">
            No matching articles found
          </h3>
          <p className="text-sm text-tan-dark max-w-md">
            We couldn&apos;t find any articles matching your search query or selected topic. Try clearing your filters.
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 bg-rose text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-rose-dark transition-all cursor-pointer"
          >
            Clear Search & Filters
          </button>
        </div>
      )}
    </div>
  );
}
