"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPriceFixed, calculateDiscountPercent } from "@/lib/format";
import type { products, posts, siteCategories, SubCategoryItem } from "@/db/schema";

type Product = typeof products.$inferSelect;
type Post = typeof posts.$inferSelect;
type SiteCategory = typeof siteCategories.$inferSelect & {
  subcategories?: SubCategoryItem[] | null;
};

interface SearchClientProps {
  initialQuery: string;
  initialType: string;
  initialCategory: string;
  initialSort: string;
  allProducts: Product[];
  allPosts: Post[];
  siteCategories: SiteCategory[];
}

export default function SearchClient({
  initialQuery,
  initialType,
  initialCategory,
  initialSort,
  allProducts,
  allPosts,
  siteCategories: rawCategories,
}: SearchClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<"all" | "products" | "posts">(
    (initialType as "all" | "products" | "posts") || "all"
  );
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || "all");
  const [sortBy, setSortBy] = useState(initialSort || "relevance");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");

  // Sync state if URL searchParams change
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) {
      setQuery(q);
    }
  }, [searchParams]);

  // Update URL query when filters change
  const updateUrl = (newQuery: string, newType: string, newCat: string, newSort: string) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set("q", newQuery.trim());
    if (newType !== "all") params.set("type", newType);
    if (newCat !== "all") params.set("category", newCat);
    if (newSort !== "relevance") params.set("sort", newSort);

    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    updateUrl(val, activeType, selectedCategory, sortBy);
  };

  const handleTypeChange = (type: "all" | "products" | "posts") => {
    setActiveType(type);
    updateUrl(query, type, selectedCategory, sortBy);
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    updateUrl(query, activeType, cat, sortBy);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    updateUrl(query, activeType, selectedCategory, sort);
  };

  const handleClearAll = () => {
    setQuery("");
    setActiveType("all");
    setSelectedCategory("all");
    setSortBy("relevance");
    setMinPrice("");
    setMaxPrice("");
    router.replace(pathname, { scroll: false });
  };

  // Distinct Categories list
  const categoryOptions = useMemo(() => {
    const cats = new Set<string>();
    rawCategories.forEach((c) => {
      if (c.label) cats.add(c.label);
      if (Array.isArray(c.subcategories)) {
        c.subcategories.forEach((sub) => {
          if (sub.label) cats.add(sub.label);
        });
      }
    });
    allProducts.forEach((p) => {
      if (p.category) cats.add(p.category);
    });
    allPosts.forEach((p) => {
      if (p.category) cats.add(p.category);
      if (p.topicLabel) cats.add(p.topicLabel);
    });
    return Array.from(cats).sort();
  }, [rawCategories, allProducts, allPosts]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const minCents = minPrice ? parseFloat(minPrice) * 100 : null;
    const maxCents = maxPrice ? parseFloat(maxPrice) * 100 : null;

    return allProducts
      .filter((p) => {
        // Query match
        if (q) {
          const matchName = p.name.toLowerCase().includes(q);
          const matchSub = p.subtitle ? p.subtitle.toLowerCase().includes(q) : false;
          const matchCat = p.category ? p.category.toLowerCase() : false;
          const matchBadge = p.badge ? p.badge.toLowerCase().includes(q) : false;
          const matchLabel = p.imageLabel ? p.imageLabel.toLowerCase().includes(q) : false;
          if (!matchName && !matchSub && !matchCat && !matchBadge && !matchLabel) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "all") {
          const catLower = selectedCategory.toLowerCase();
          const pCatLower = p.category ? p.category.toLowerCase() : "";
          if (pCatLower !== catLower && !pCatLower.includes(catLower)) {
            return false;
          }
        }

        // Price range filter
        if (minCents !== null && p.priceCents < minCents) return false;
        if (maxCents !== null && p.priceCents > maxCents) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "price-asc") {
          return a.priceCents - b.priceCents;
        }
        if (sortBy === "price-desc") {
          return b.priceCents - a.priceCents;
        }
        if (sortBy === "discount") {
          const discA = a.discountPercent || calculateDiscountPercent(a.priceCents, a.compareAtPriceCents) || 0;
          const discB = b.discountPercent || calculateDiscountPercent(b.priceCents, b.compareAtPriceCents) || 0;
          return discB - discA;
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        // Relevance / default: featured and best seller first
        if (a.isFeaturedHome !== b.isFeaturedHome) return a.isFeaturedHome ? -1 : 1;
        if (a.isBestSeller !== b.isBestSeller) return a.isBestSeller ? -1 : 1;
        return 0;
      });
  }, [allProducts, query, selectedCategory, sortBy, minPrice, maxPrice]);

  // Filtered Posts
  const filteredPosts = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allPosts
      .filter((post) => {
        // Query match
        if (q) {
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchExcerpt = post.excerpt ? post.excerpt.toLowerCase().includes(q) : false;
          const matchCat = post.category ? post.category.toLowerCase() : false;
          const matchTopic = post.topicLabel ? post.topicLabel.toLowerCase() : false;
          const matchAuthor = post.author ? post.author.toLowerCase().includes(q) : false;
          if (!matchTitle && !matchExcerpt && !matchCat && !matchTopic && !matchAuthor) {
            return false;
          }
        }

        // Category filter
        if (selectedCategory !== "all") {
          const catLower = selectedCategory.toLowerCase();
          const pCatLower = post.category ? post.category.toLowerCase() : "";
          const pTopicLower = post.topicLabel ? post.topicLabel.toLowerCase() : "";
          if (pCatLower !== catLower && !pCatLower.includes(catLower) && !pTopicLower.includes(catLower)) {
            return false;
          }
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
        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
      });
  }, [allPosts, query, selectedCategory, sortBy]);

  const totalResultsCount = filteredProducts.length + filteredPosts.length;
  const isFiltering = query.trim() !== "" || selectedCategory !== "all" || sortBy !== "relevance" || minPrice !== "" || maxPrice !== "";

  const popularSearches = [
    "Garment Steamer",
    "Concealer",
    "Makeup Essentials",
    "Silk Pillowcase",
    "Jewelry Box",
    "Fabric Shaver",
    "Setting Powder",
  ];

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Search Header Banner */}
      <section className="bg-gradient-to-br from-mauve-100/70 via-cream to-pink-50/50 rounded-3xl border border-border/80 p-6 md:p-10 shadow-[0_4px_24px_rgba(90,47,69,0.04)]">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-lilac/30 text-purple-deep text-xs font-bold uppercase tracking-wider shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-lilac animate-pulse" />
            Lilac Drawer Search & Filter
          </div>

          <h1 className="font-heading text-3xl md:text-4xl text-purple-deep tracking-tight">
            {query.trim() ? (
              <>
                Results for <span className="text-rose font-bold">&ldquo;{query.trim()}&rdquo;</span>
              </>
            ) : (
              "Explore Everything on Lilac Drawer"
            )}
          </h1>

          <p className="text-sm text-tan-dark max-w-xl mx-auto leading-relaxed">
            Search across all tested beauty reviews, fabric & wardrobe care routines, verified product deals, and buying recommendations.
          </p>

          {/* Interactive Search Input Box */}
          <div className="relative max-w-xl mx-auto pt-2">
            <div className="flex items-center bg-white rounded-2xl px-4 py-3 border border-border shadow-[0_4px_20px_rgba(90,47,69,0.08)] focus-within:border-lilac focus-within:ring-3 focus-within:ring-lilac/20 transition-all">
              <svg className="w-5 h-5 text-tan-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search reviews, products, deals, topics..."
                className="w-full bg-transparent border-none outline-none px-3 text-sm md:text-base text-purple-deep placeholder:text-tan-dark/70"
                autoFocus
              />
              {query && (
                <button
                  type="button"
                  onClick={() => handleQueryChange("")}
                  className="w-6 h-6 rounded-full hover:bg-mauve-100 flex items-center justify-center text-tan-dark text-xs transition-colors cursor-pointer shrink-0"
                  aria-label="Clear input"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Popular Quick Keyword Pills */}
            <div className="flex items-center justify-center gap-1.5 flex-wrap pt-3 text-xs">
              <span className="text-tan-dark font-semibold">Popular:</span>
              {popularSearches.map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => handleQueryChange(term)}
                  className="px-2.5 py-1 rounded-full bg-white/70 hover:bg-lilac hover:text-white border border-border/80 text-purple-deep text-[11px] font-medium transition-colors cursor-pointer"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filter Toolbar & Tab Switchers */}
      <div className="flex flex-col gap-4 bg-white/80 backdrop-blur-md rounded-2xl border border-border p-4 md:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Main Type Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-mauve-50/80 rounded-xl border border-border/60">
            <button
              type="button"
              onClick={() => handleTypeChange("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "all"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "text-tan-dark hover:text-purple-deep hover:bg-white"
              }`}
            >
              All Results ({totalResultsCount})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("products")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "products"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "text-tan-dark hover:text-purple-deep hover:bg-white"
              }`}
            >
              Products & Deals ({filteredProducts.length})
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange("posts")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeType === "posts"
                  ? "bg-purple-deep text-white shadow-xs"
                  : "text-tan-dark hover:text-purple-deep hover:bg-white"
              }`}
            >
              Articles & Guides ({filteredPosts.length})
            </button>
          </div>

          {/* Controls: Category, Sort, Clear */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="search-cat-select" className="text-xs font-bold text-tan-dark uppercase tracking-wider">
                Category:
              </label>
              <select
                id="search-cat-select"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-purple-deep outline-none focus:border-lilac cursor-pointer"
              >
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="search-sort-select" className="text-xs font-bold text-tan-dark uppercase tracking-wider">
                Sort By:
              </label>
              <select
                id="search-sort-select"
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="bg-cream-alt border border-border rounded-xl px-3 py-1.5 text-xs font-semibold text-purple-deep outline-none focus:border-lilac cursor-pointer"
              >
                <option value="relevance">Relevance / Featured</option>
                <option value="newest">Newest First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Highest Discount</option>
              </select>
            </div>

            {/* Price Filter for Products */}
            {(activeType === "products" || activeType === "all") && (
              <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-border">
                <span className="text-xs font-bold text-tan-dark uppercase tracking-wider">Price:</span>
                <input
                  type="number"
                  placeholder="Min $"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-16 bg-cream-alt border border-border rounded-lg px-2 py-1 text-xs text-purple-deep outline-none focus:border-lilac"
                />
                <span className="text-xs text-tan">-</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-16 bg-cream-alt border border-border rounded-lg px-2 py-1 text-xs text-purple-deep outline-none focus:border-lilac"
                />
              </div>
            )}

            {/* Reset Button */}
            {isFiltering && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs font-bold text-rose hover:underline px-2 py-1 cursor-pointer"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Summary Bar */}
        {isFiltering && (
          <div className="flex items-center gap-2 flex-wrap pt-3 border-t border-border/60 text-xs">
            <span className="text-tan-dark font-semibold">Active filters:</span>
            {query && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep px-2.5 py-0.5 rounded-full font-medium">
                Keyword: &ldquo;{query}&rdquo;
                <button type="button" onClick={() => handleQueryChange("")} className="text-tan-dark hover:text-purple-deep">✕</button>
              </span>
            )}
            {selectedCategory !== "all" && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep px-2.5 py-0.5 rounded-full font-medium">
                Category: {selectedCategory}
                <button type="button" onClick={() => handleCategoryChange("all")} className="text-tan-dark hover:text-purple-deep">✕</button>
              </span>
            )}
            {sortBy !== "relevance" && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep px-2.5 py-0.5 rounded-full font-medium">
                Sorted by: {sortBy}
                <button type="button" onClick={() => handleSortChange("relevance")} className="text-tan-dark hover:text-purple-deep">✕</button>
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep px-2.5 py-0.5 rounded-full font-medium">
                Price: ${minPrice || "0"} - ${maxPrice || "∞"}
                <button type="button" onClick={() => { setMinPrice(""); setMaxPrice(""); }} className="text-tan-dark hover:text-purple-deep">✕</button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {totalResultsCount === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-3xl border border-border p-12 text-center space-y-4 shadow-sm max-w-xl mx-auto my-6">
          <div className="w-16 h-16 rounded-full bg-mauve-100 text-purple-deep flex items-center justify-center mx-auto shadow-xs">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="font-heading text-2xl text-purple-deep">
            No results found for &ldquo;{query}&rdquo;
          </h2>
          <p className="text-xs md:text-sm text-tan-dark leading-relaxed">
            We couldn&apos;t find any articles or deals matching your current search and filters. Try searching for a broader term or resetting your filters.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleClearAll}
              className="bg-purple-deep hover:bg-lilac text-white px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              Reset All Filters
            </button>
            <Link
              href="/blog/all"
              className="bg-cream-alt border border-border hover:bg-mauve-50 text-purple-deep px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              Browse All Articles
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Articles Section (Shown when activeType === 'all' or 'posts') */}
          {(activeType === "all" || activeType === "posts") && filteredPosts.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-5 bg-rose rounded-full" />
                  <h2 className="font-heading text-2xl text-purple-deep">
                    Articles & Buying Guides ({filteredPosts.length})
                  </h2>
                </div>
                {activeType === "all" && filteredPosts.length > 6 && (
                  <button
                    type="button"
                    onClick={() => handleTypeChange("posts")}
                    className="text-xs font-bold text-rose hover:underline cursor-pointer"
                  >
                    View all {filteredPosts.length} articles →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeType === "all" ? filteredPosts.slice(0, 6) : filteredPosts).map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-md hover:border-lilac/60 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-[16/9] bg-mauve-100 overflow-hidden">
                        <ImageSlot
                          imageUrl={post.imageUrl}
                          label={post.imageLabel || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span className="absolute top-3 left-3 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-deep/90 backdrop-blur-xs text-white uppercase tracking-wider">
                          {post.category}
                        </span>
                      </div>

                      <div className="p-5 flex flex-col gap-2">
                        <h3 className="font-heading text-lg font-bold text-purple-deep group-hover:text-lilac transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-xs text-tan-dark line-clamp-2 leading-relaxed">
                          {post.excerpt}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center justify-between border-t border-mauve-50 text-[11px] text-tan">
                      <span>By {post.author}</span>
                      <span className="text-rose font-bold group-hover:translate-x-1 transition-transform">
                        Read Review →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Products Section (Shown when activeType === 'all' or 'products') */}
          {(activeType === "all" || activeType === "products") && filteredProducts.length > 0 && (
            <section className="flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="w-2 h-5 bg-lilac rounded-full" />
                  <h2 className="font-heading text-2xl text-purple-deep">
                    Tested Products & Deals ({filteredProducts.length})
                  </h2>
                </div>
                {activeType === "all" && filteredProducts.length > 8 && (
                  <button
                    type="button"
                    onClick={() => handleTypeChange("products")}
                    className="text-xs font-bold text-rose hover:underline cursor-pointer"
                  >
                    View all {filteredProducts.length} products →
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {(activeType === "all" ? filteredProducts.slice(0, 8) : filteredProducts).map((product) => {
                  const discount = product.discountPercent || calculateDiscountPercent(product.priceCents, product.compareAtPriceCents);

                  return (
                    <div
                      key={product.id}
                      className="bg-white rounded-2xl border border-border overflow-hidden shadow-xs hover:shadow-md hover:border-lilac/60 transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* Image Box */}
                        <div className="relative aspect-[4/3] bg-mauve-50/50 p-4 overflow-hidden flex items-center justify-center">
                          <Link href={`/deals/${product.slug}`} className="block w-full h-full">
                            <ImageSlot
                              imageUrl={product.imageUrl}
                              label={product.imageLabel || product.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          </Link>

                          {/* Badges */}
                          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                            {product.badge && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gold/90 text-white shadow-2xs">
                                {product.badge}
                              </span>
                            )}
                            {discount && discount > 0 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose text-white shadow-2xs">
                                {discount}% OFF
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-tan">
                            {product.category}
                          </span>
                          <Link href={`/deals/${product.slug}`}>
                            <h3 className="text-xs font-bold text-purple-deep group-hover:text-lilac transition-colors line-clamp-2 leading-snug">
                              {product.name}
                            </h3>
                          </Link>
                          {product.subtitle && (
                            <p className="text-[11px] text-tan-dark line-clamp-1">
                              {product.subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Footer Price & Action */}
                      <div className="p-4 pt-0 flex items-center justify-between border-t border-mauve-50/60 mt-2">
                        <div>
                          <div className="text-sm font-bold text-purple-deep">
                            {formatPriceFixed(product.priceCents)}
                          </div>
                          {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
                            <div className="text-[10px] text-tan line-through">
                              {formatPriceFixed(product.compareAtPriceCents)}
                            </div>
                          )}
                        </div>

                        <Link
                          href={`/deals/${product.slug}`}
                          className="px-3.5 py-1.5 bg-lilac hover:bg-purple-deep text-white text-[11px] font-bold rounded-xl transition-all shadow-2xs"
                        >
                          View Deal
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
