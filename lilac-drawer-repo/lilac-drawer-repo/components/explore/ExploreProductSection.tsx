"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPrice, formatPriceFixed, calculateDiscountPercent } from "@/lib/format";
import type { products as productsSchema, ArticleStorePrice } from "@/db/schema";

type Product = typeof productsSchema.$inferSelect;

interface Props {
  initialProducts: Product[];
}

export default function ExploreProductSection({ initialProducts }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quickFilter, setQuickFilter] = useState<"all" | "deals" | "top-picks" | "under-30" | "in-stock">("all");
  const [sortBy, setSortBy] = useState<"discount" | "price-asc" | "price-desc" | "rank" | "name">("discount");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedStore, setSelectedStore] = useState("all");

  // Extract unique categories and counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of initialProducts) {
      const cat = p.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [initialProducts]);

  const categories = useMemo(() => Object.keys(categoryCounts).sort(), [categoryCounts]);

  // Extract unique stores
  const storesList = useMemo(() => {
    const storesSet = new Set<string>();
    for (const p of initialProducts) {
      if (Array.isArray(p.stores)) {
        for (const s of p.stores as ArticleStorePrice[]) {
          if (s.storeName) storesSet.add(s.storeName);
        }
      }
    }
    return Array.from(storesSet).sort();
  }, [initialProducts]);

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesCat = p.category ? p.category.toLowerCase().includes(q) : false;
          const matchesSub = p.subtitle ? p.subtitle.toLowerCase().includes(q) : false;
          const matchesNote = p.rankNote ? p.rankNote.toLowerCase().includes(q) : false;
          if (!matchesName && !matchesCat && !matchesSub && !matchesNote) return false;
        }

        // Category
        if (selectedCategory !== "all" && p.category !== selectedCategory) {
          return false;
        }

        // Quick filter
        if (quickFilter === "deals") {
          const discount = p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents) ?? 0;
          if (discount <= 0 && !p.isExploreDeal && !p.isSaleOff && !p.isTodayDeal) return false;
        } else if (quickFilter === "top-picks") {
          if (!p.isTopPick && p.rank == null && !p.isBestSeller) return false;
        } else if (quickFilter === "under-30") {
          if (p.priceCents >= 3000) return false;
        } else if (quickFilter === "in-stock") {
          if (!p.inStock) return false;
        }

        // Store
        if (selectedStore !== "all") {
          if (!Array.isArray(p.stores)) return false;
          const hasStore = (p.stores as ArticleStorePrice[]).some(
            (st) => st.storeName?.toLowerCase() === selectedStore.toLowerCase()
          );
          if (!hasStore) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const discountA = a.discountPercent ?? calculateDiscountPercent(a.priceCents, a.compareAtPriceCents) ?? 0;
        const discountB = b.discountPercent ?? calculateDiscountPercent(b.priceCents, b.compareAtPriceCents) ?? 0;

        if (sortBy === "discount") {
          return discountB - discountA;
        }
        if (sortBy === "price-asc") {
          return a.priceCents - b.priceCents;
        }
        if (sortBy === "price-desc") {
          return b.priceCents - a.priceCents;
        }
        if (sortBy === "rank") {
          const rankA = a.rank ?? 999;
          const rankB = b.rank ?? 999;
          return rankA - rankB;
        }
        if (sortBy === "name") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [initialProducts, searchQuery, selectedCategory, quickFilter, sortBy, selectedStore]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    quickFilter !== "all" ||
    selectedStore !== "all";

  function resetAllFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setQuickFilter("all");
    setSortBy("discount");
    setSelectedStore("all");
  }

  return (
    <section className="flex flex-col gap-6" id="explore-catalog">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose mb-1">
            <svg className="w-3.5 h-3.5 text-rose" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            <span>Complete Catalog</span>
            <span>•</span>
            <span>{initialProducts.length} Verified Picks</span>
          </div>
          <h2 className="font-heading text-2xl md:text-3xl text-purple-deep font-bold">
            Explore All Products &amp; Reviews
          </h2>
          <p className="text-xs md:text-sm text-tan-dark mt-1">
            Filter by category, search specific items, compare real store prices, and read tested recommendations.
          </p>
        </div>

        {/* View Mode & Count */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-xs text-tan-dark font-medium">
            Showing <span className="font-bold text-purple-deep">{filteredProducts.length}</span> items
          </div>
          <div className="flex items-center border border-border rounded-xl overflow-hidden bg-mauve-50/50">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 transition-colors cursor-pointer ${
                viewMode === "grid" ? "bg-purple-deep text-white" : "text-tan hover:text-purple-deep"
              }`}
              aria-label="Grid View"
              title="Grid View"
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
              title="List View"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls Bar: Search + Quick Category Tabs */}
      <div className="flex flex-col gap-3.5 bg-cream-alt border border-border rounded-2xl p-4 md:p-5 shadow-xs">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by product name, brand, category, or feature..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-border rounded-xl text-sm text-purple-deep placeholder:text-tan outline-none focus:border-rose focus:ring-2 focus:ring-rose/20 transition-all"
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tan hover:text-purple-deep p-1 rounded-full hover:bg-mauve-100 transition-colors cursor-pointer"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold uppercase tracking-wider text-tan-dark hidden lg:inline-block shrink-0">
              Sort:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full sm:w-auto px-3.5 py-2.5 bg-white border border-border rounded-xl text-xs font-semibold text-purple-deep outline-none focus:border-rose cursor-pointer"
            >
              <option value="discount">Highest Discount</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rank">Top Ranked First</option>
              <option value="name">Name: A to Z</option>
            </select>
          </div>

          {/* Store Filter Selector (if multiple stores exist) */}
          {storesList.length > 0 && (
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full sm:w-auto px-3 py-2.5 bg-white border border-border rounded-xl text-xs font-semibold text-purple-deep outline-none focus:border-rose cursor-pointer"
            >
              <option value="all">All Retailers</option>
              {storesList.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar pt-1 border-t border-border/70 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              selectedCategory === "all"
                ? "bg-purple-deep text-white shadow-xs"
                : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
            }`}
          >
            <span>All Categories</span>
            <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${selectedCategory === "all" ? "bg-white/20 text-white" : "bg-mauve-100 text-tan-dark"}`}>
              {initialProducts.length}
            </span>
          </button>
          {categories.map((cat) => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-purple-deep text-white shadow-xs"
                    : "bg-white border border-border text-purple-deep hover:bg-mauve-50"
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10.5px] px-1.5 py-0.2 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-mauve-100 text-tan-dark"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Quick Filter Badges */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-tan-dark mr-1">
            Quick Filters:
          </span>
          {[
            {
              id: "all",
              label: "All Items",
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ),
            },
            {
              id: "deals",
              label: "On Sale / Deals",
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              ),
            },
            {
              id: "top-picks",
              label: "Top Picks & Bestsellers",
              icon: (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ),
            },
            {
              id: "under-30",
              label: "Under $30",
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
            {
              id: "in-stock",
              label: "In Stock Only",
              icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ),
            },
          ].map((f) => {
            const isSelected = quickFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setQuickFilter(f.id as any)}
                className={`text-[11.5px] font-semibold px-2.5 py-1 rounded-lg border transition-all cursor-pointer inline-flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-rose text-white border-rose font-bold shadow-xs"
                    : "bg-white border-border text-purple-deep hover:bg-mauve-50"
                }`}
              >
                {f.icon}
                <span>{f.label}</span>
              </button>
            );
          })}
          {hasActiveFilters && (
            <button
              onClick={resetAllFilters}
              className="text-xs font-bold text-rose hover:underline ml-auto cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="bg-white rounded-3xl border border-border p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep">
            <svg className="w-8 h-8 text-purple-deep" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="font-heading text-xl font-bold text-purple-deep">
            No products match your current filters
          </h3>
          <p className="text-sm text-tan-dark max-w-md">
            Try clearing your search term, selecting another category, or resetting all filters to see our full verified collection.
          </p>
          <button
            onClick={resetAllFilters}
            className="mt-2 bg-purple-deep text-white text-xs font-bold px-6 py-2.5 rounded-full hover:bg-purple-deep/90 transition-colors cursor-pointer"
          >
            Reset All Filters
          </button>
        </div>
      )}

      {/* GRID VIEW */}
      {viewMode === "grid" && filteredProducts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredProducts.map((p) => {
            const discount =
              p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents);
            const savedCents =
              p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents
                ? p.compareAtPriceCents - p.priceCents
                : 0;
            const stores: ArticleStorePrice[] = Array.isArray(p.stores) ? p.stores : [];
            const primaryAffiliateUrl =
              p.affiliateUrl || (stores.length > 0 && stores[0].url ? stores[0].url : undefined);

            return (
              <div
                key={p.id}
                className="bg-white rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group p-3.5 sm:p-5"
              >
                <div>
                  {/* Image Container with Badges */}
                  <Link href={`/deals/${p.slug}`} className="block relative mb-3 sm:mb-4">
                    <div className="rounded-xl sm:rounded-2xl overflow-hidden bg-mauve-50/60 aspect-[4/3] flex items-center justify-center border border-border/60">
                      <ImageSlot
                        imageUrl={p.imageUrl}
                        label={p.imageLabel || p.name}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                        shape="rounded"
                        radius={16}
                        tone="mauve"
                      />
                    </div>

                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                      {discount ? (
                        <span className="bg-rose text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                          -{discount}% OFF
                        </span>
                      ) : null}
                      {p.rank != null && (
                        <span className="bg-purple-deep text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <span>#{p.rank}</span>
                          <span>Top Pick</span>
                        </span>
                      )}
                    </div>

                    {p.badge && (
                      <span className="absolute top-3 right-3 bg-pink-100 text-purple-deep text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-xs">
                        {p.badge}
                      </span>
                    )}
                  </Link>

                  {/* Category & Stock */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose">
                      {p.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.inStock ? "bg-sage/15 text-sage" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <Link href={`/deals/${p.slug}`} className="block group/title mb-1.5">
                    <h3 className="font-heading text-base font-bold text-purple-deep group-hover/title:text-rose transition-colors line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </Link>

                  {p.subtitle && (
                    <p className="text-xs text-tan-dark line-clamp-1 mb-2">{p.subtitle}</p>
                  )}

                  {/* Pricing & Savings Box */}
                  <div className="flex items-baseline gap-2.5 my-2.5 p-2.5 rounded-xl bg-mauve-50/50 border border-border/60">
                    <span className="font-heading font-bold text-xl text-rose">
                      {formatPrice(p.priceCents)}
                    </span>
                    {p.compareAtPriceCents ? (
                      <span className="text-xs text-tan line-through">
                        {formatPriceFixed(p.compareAtPriceCents)}
                      </span>
                    ) : null}
                    {savedCents > 0 && (
                      <span className="ml-auto text-[10.5px] font-bold text-sage bg-sage/15 px-2 py-0.5 rounded-md">
                        Save {formatPriceFixed(savedCents)}
                      </span>
                    )}
                  </div>

                  {/* Store tags */}
                  {stores.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {stores.slice(0, 3).map((st, idx) => (
                        <a
                          key={st.id || idx}
                          href={st.url || primaryAffiliateUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="text-[10.5px] font-medium bg-mauve-100 hover:bg-mauve-200 text-purple-deep px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1"
                        >
                          <span>{st.storeName}</span>
                          {st.price && <span className="font-bold">{st.price}</span>}
                          <span className="text-[9px]">↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-border mt-1">
                  <Link
                    href={`/deals/${p.slug}`}
                    className="flex-1 text-center py-2.5 px-3 rounded-xl bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    Explore &amp; Review
                  </Link>
                  {primaryAffiliateUrl && (
                    <a
                      href={primaryAffiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="py-2.5 px-3.5 rounded-xl bg-rose hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-xs"
                      title="Direct Retailer Deal"
                    >
                      Buy ↗
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* LIST VIEW */}
      {viewMode === "list" && filteredProducts.length > 0 && (
        <div className="flex flex-col gap-4">
          {filteredProducts.map((p) => {
            const discount =
              p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents);
            const savedCents =
              p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents
                ? p.compareAtPriceCents - p.priceCents
                : 0;
            const stores: ArticleStorePrice[] = Array.isArray(p.stores) ? p.stores : [];
            const primaryAffiliateUrl =
              p.affiliateUrl || (stores.length > 0 && stores[0].url ? stores[0].url : undefined);

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-border p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group"
              >
                {/* Left Thumbnail */}
                <Link
                  href={`/deals/${p.slug}`}
                  className="relative w-full md:w-44 h-40 shrink-0 rounded-2xl overflow-hidden bg-mauve-50/60 border border-border/60"
                >
                  <ImageSlot
                    imageUrl={p.imageUrl}
                    label={p.imageLabel || p.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    shape="rounded"
                    radius={16}
                    tone="mauve"
                  />
                  {discount ? (
                    <span className="absolute top-2 left-2 bg-rose text-white text-[10.5px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                      -{discount}% OFF
                    </span>
                  ) : null}
                </Link>

                {/* Middle Info */}
                <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose">
                      {p.category}
                    </span>
                    {p.rank != null && (
                      <span className="bg-purple-deep text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        #{p.rank} Top Pick
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.inStock ? "bg-sage/15 text-sage" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {p.inStock ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>

                  <Link href={`/deals/${p.slug}`}>
                    <h3 className="font-heading text-lg font-bold text-purple-deep group-hover:text-rose transition-colors leading-snug">
                      {p.name}
                    </h3>
                  </Link>

                  {p.subtitle && <p className="text-xs text-tan-dark">{p.subtitle}</p>}
                  {p.rankNote && (
                    <p className="text-xs text-purple-deep/80 italic line-clamp-1 mt-1">
                      &ldquo;{p.rankNote}&rdquo;
                    </p>
                  )}

                  {stores.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {stores.map((st, idx) => (
                        <a
                          key={st.id || idx}
                          href={st.url || primaryAffiliateUrl || "#"}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="text-[11px] font-medium bg-mauve-100 hover:bg-mauve-200 text-purple-deep px-2.5 py-1 rounded-md transition-colors inline-flex items-center gap-1.5"
                        >
                          <span>{st.storeName}:</span>
                          <span className="font-bold">{st.price || formatPrice(p.priceCents)}</span>
                          <span>↗</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Price & Actions */}
                <div className="w-full md:w-56 shrink-0 flex flex-col items-start md:items-end justify-between gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="font-heading font-bold text-2xl text-rose">
                        {formatPrice(p.priceCents)}
                      </span>
                      {p.compareAtPriceCents ? (
                        <span className="text-sm text-tan line-through">
                          {formatPriceFixed(p.compareAtPriceCents)}
                        </span>
                      ) : null}
                    </div>
                    {savedCents > 0 && (
                      <div className="text-xs font-bold text-sage mt-1">
                        Save {formatPriceFixed(savedCents)} ({discount}% OFF)
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 w-full">
                    <Link
                      href={`/deals/${p.slug}`}
                      className="flex-1 text-center py-2 px-3 rounded-xl bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold transition-all shadow-xs"
                    >
                      Review &amp; Deals
                    </Link>
                    {primaryAffiliateUrl && (
                      <a
                        href={primaryAffiliateUrl}
                        target="_blank"
                        rel="noopener noreferrer sponsored"
                        className="py-2 px-3.5 rounded-xl bg-rose hover:bg-rose-dark text-white text-xs font-bold transition-all shadow-xs"
                        title="Buy from retailer"
                      >
                        Buy ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
