"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import { formatPrice, formatPriceFixed, calculateDiscountPercent } from "@/lib/format";
import type { products as productsSchema, ArticleStorePrice } from "@/db/schema";


type Product = typeof productsSchema.$inferSelect;

interface Props {
  title: string;
  subtitle: string;
  badge: string;
  collectionType: "today-deals" | "new-arrivals" | "best-sellers" | "all-deals";
  initialProducts: Product[];
}

export default function DealsProductExplorer({
  title,
  subtitle,
  badge,
  collectionType,
  initialProducts,
}: Props) {
  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<
    "discount-desc" | "price-asc" | "price-desc" | "rank-asc" | "name-asc" | "newest"
  >("discount-desc");
  const [priceRange, setPriceRange] = useState<
    "all" | "under-15" | "15-30" | "30-50" | "50-plus" | "custom"
  >("all");
  const [customMinPrice, setCustomMinPrice] = useState("");
  const [customMaxPrice, setCustomMaxPrice] = useState("");
  const [minDiscount, setMinDiscount] = useState<number>(0);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedStore, setSelectedStore] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  // Filtered and Sorted Products
  const filteredProducts = useMemo(() => {
    return initialProducts
      .filter((p) => {
        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesCat = p.category.toLowerCase().includes(q);
          const matchesSub = p.subtitle ? p.subtitle.toLowerCase().includes(q) : false;
          const matchesNote = p.rankNote ? p.rankNote.toLowerCase().includes(q) : false;
          if (!matchesName && !matchesCat && !matchesSub && !matchesNote) return false;
        }

        // Category filter
        if (selectedCategory !== "all" && p.category !== selectedCategory) {
          return false;
        }

        // In-stock filter
        if (inStockOnly && !p.inStock) {
          return false;
        }

        // Price filter
        const priceDollars = p.priceCents / 100;
        if (priceRange === "under-15" && priceDollars >= 15) return false;
        if (priceRange === "15-30" && (priceDollars < 15 || priceDollars > 30)) return false;
        if (priceRange === "30-50" && (priceDollars < 30 || priceDollars > 50)) return false;
        if (priceRange === "50-plus" && priceDollars < 50) return false;
        if (priceRange === "custom") {
          const min = parseFloat(customMinPrice);
          const max = parseFloat(customMaxPrice);
          if (!isNaN(min) && priceDollars < min) return false;
          if (!isNaN(max) && priceDollars > max) return false;
        }

        // Discount filter
        const discount =
          p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents) ?? 0;
        if (minDiscount > 0 && discount < minDiscount) {
          return false;
        }

        // Store filter
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
        const discountA =
          a.discountPercent ?? calculateDiscountPercent(a.priceCents, a.compareAtPriceCents) ?? 0;
        const discountB =
          b.discountPercent ?? calculateDiscountPercent(b.priceCents, b.compareAtPriceCents) ?? 0;

        if (sortBy === "discount-desc") {
          return discountB - discountA;
        }
        if (sortBy === "price-asc") {
          return a.priceCents - b.priceCents;
        }
        if (sortBy === "price-desc") {
          return b.priceCents - a.priceCents;
        }
        if (sortBy === "rank-asc") {
          const rankA = a.rank ?? 999;
          const rankB = b.rank ?? 999;
          return rankA - rankB;
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === "newest") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [
    initialProducts,
    searchQuery,
    selectedCategory,
    sortBy,
    priceRange,
    customMinPrice,
    customMaxPrice,
    minDiscount,
    inStockOnly,
    selectedStore,
  ]);

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    selectedCategory !== "all" ||
    priceRange !== "all" ||
    minDiscount > 0 ||
    inStockOnly ||
    selectedStore !== "all";

  function resetAllFilters() {
    setSearchQuery("");
    setSelectedCategory("all");
    setSortBy("discount-desc");
    setPriceRange("all");
    setCustomMinPrice("");
    setCustomMaxPrice("");
    setMinDiscount(0);
    setInStockOnly(false);
    setSelectedStore("all");
  }

  const collectionTabs = [
    { label: "Today's Deals", href: "/deals/today-deals", key: "today-deals" },
    { label: "New Arrivals", href: "/deals/new-arrivals", key: "new-arrivals" },
    { label: "Best Sellers", href: "/deals/best-sellers", key: "best-sellers" },
    { label: "Deals Overview", href: "/deals", key: "all-deals" },
    { label: "Deal Guides & Blog", href: "/deals/blog", key: "blog" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Hero Banner & Collection Switcher */}
      <div className="bg-mauve-50/80 border border-border rounded-2xl sm:rounded-3xl p-4.5 sm:p-8 md:p-10 shadow-xs relative overflow-hidden">
        <div className="relative z-10 max-w-[780px]">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumbs" className="flex items-center gap-2 text-xs text-tan mb-2.5 sm:mb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link href="/" className="hover:text-purple-deep">
              Home
            </Link>
            <span>/</span>
            <Link href="/deals" className="hover:text-purple-deep">
              Deals
            </Link>
            <span>/</span>
            <span className="text-purple-deep font-semibold">{title}</span>
          </nav>

          <div className="inline-flex items-center gap-2 bg-rose text-white text-[11px] sm:text-xs font-bold px-3 py-1 rounded-full mb-2.5 sm:mb-3 shadow-xs">
            <span>{badge}</span>
          </div>

          <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold text-purple-deep leading-tight mb-2.5 sm:mb-3">
            {title}
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-tan-dark leading-relaxed mb-4 sm:mb-6">
            {subtitle}
          </p>

          {/* Quick Collection Switcher Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
            {collectionTabs.map((tab) => {
              const isActive = collectionType === tab.key;
              return (
                <Link
                  key={tab.key}
                  href={tab.href}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
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

        {/* Decorative background circle */}
        <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-pink-100/50 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Top Search, Sort & Control Bar */}
      <div className="bg-white border border-border rounded-2xl p-4 shadow-[var(--shadow-card)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals by product, category, or keyword..."
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

        {/* Controls: Count, Sort Dropdown & Layout Buttons */}
        <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto flex-wrap">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden px-4 py-2 bg-mauve-50 border border-border rounded-xl text-xs font-bold text-purple-deep flex items-center gap-1.5 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span>Filters {hasActiveFilters && "• Active"}</span>
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase tracking-wider text-tan-dark hidden sm:inline-block">
              Sort By:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3.5 py-2 bg-mauve-50/50 border border-border rounded-xl text-xs font-semibold text-purple-deep outline-none focus:border-rose cursor-pointer"
            >
              <option value="discount-desc">Highest Discount %</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rank-asc">Top Ranked (#1 First)</option>
              <option value="name-asc">Product Name (A-Z)</option>
              <option value="newest">Newest Added</option>
            </select>
          </div>

          {/* View Mode Toggle */}
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

      {/* Main Content Layout: Sidebar Filters + Products List */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
        {/* Filter Sidebar */}
        <aside
          className={`bg-white border border-border rounded-3xl p-6 shadow-[var(--shadow-card)] flex flex-col gap-6 ${
            showMobileFilters ? "block" : "hidden lg:flex"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <h3 className="font-heading text-lg font-bold text-purple-deep">Filter Deals</h3>
            {hasActiveFilters && (
              <button
                onClick={resetAllFilters}
                className="text-xs font-bold text-rose hover:underline cursor-pointer"
              >
                Reset All
              </button>
            )}
          </div>

          {/* 1. Category Filter */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Categories
            </label>
            <div className="flex flex-col gap-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                  selectedCategory === "all"
                    ? "bg-purple-deep text-white font-bold"
                    : "text-purple-deep hover:bg-mauve-50"
                }`}
              >
                <span>All Categories</span>
                <span className={`text-[11px] px-1.5 py-0.5 rounded-full ${selectedCategory === "all" ? "bg-white/20" : "bg-mauve-100"}`}>
                  {initialProducts.length}
                </span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-purple-deep text-white font-bold"
                      : "text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  <span className="truncate pr-2">{cat}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-full shrink-0 ${selectedCategory === cat ? "bg-white/20" : "bg-mauve-100"}`}>
                    {categoryCounts[cat] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Price Range */}
          <div className="flex flex-col gap-2.5 border-t border-border pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Price Range
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { label: "All Prices", value: "all" },
                { label: "Under $15", value: "under-15" },
                { label: "$15 – $30", value: "15-30" },
                { label: "$30 – $50", value: "30-50" },
                { label: "$50 & Above", value: "50-plus" },
                { label: "Custom", value: "custom" },
              ].map((p) => (
                <button
                  key={p.value}
                  onClick={() => setPriceRange(p.value as any)}
                  className={`py-1.5 px-2.5 rounded-lg border text-center transition-all cursor-pointer font-medium ${
                    priceRange === p.value
                      ? "bg-rose text-white border-rose font-bold"
                      : "bg-white border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {priceRange === "custom" && (
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="number"
                  placeholder="Min $"
                  value={customMinPrice}
                  onChange={(e) => setCustomMinPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-mauve-50/50 border border-border rounded-lg text-xs outline-none focus:border-rose"
                />
                <span className="text-tan text-xs">–</span>
                <input
                  type="number"
                  placeholder="Max $"
                  value={customMaxPrice}
                  onChange={(e) => setCustomMaxPrice(e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 bg-mauve-50/50 border border-border rounded-lg text-xs outline-none focus:border-rose"
                />
              </div>
            )}
          </div>

          {/* 3. Minimum Discount */}
          <div className="flex flex-col gap-2.5 border-t border-border pt-4">
            <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
              Discount Percentage
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: "Any Discount", val: 0 },
                { label: "10%+ OFF", val: 10 },
                { label: "15%+ OFF", val: 15 },
                { label: "20%+ OFF", val: 20 },
                { label: "30%+ OFF", val: 30 },
              ].map((d) => (
                <button
                  key={d.val}
                  onClick={() => setMinDiscount(d.val)}
                  className={`px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer font-medium ${
                    minDiscount === d.val
                      ? "bg-rose text-white border-rose font-bold"
                      : "bg-white border-border text-purple-deep hover:bg-mauve-50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Retailer / Store Filter */}
          {storesList.length > 0 && (
            <div className="flex flex-col gap-2.5 border-t border-border pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-purple-deep">
                Retailer / Store
              </label>
              <select
                value={selectedStore}
                onChange={(e) => setSelectedStore(e.target.value)}
                className="w-full px-3 py-2 bg-mauve-50/50 border border-border rounded-xl text-xs font-semibold text-purple-deep outline-none focus:border-rose cursor-pointer"
              >
                <option value="all">All Retailers</option>
                {storesList.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 5. In Stock Only Toggle */}
          <div className="border-t border-border pt-4">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-rose focus:ring-rose accent-rose cursor-pointer"
              />
              <span className="text-xs font-bold text-purple-deep">In Stock Items Only</span>
            </label>
          </div>
        </aside>

        {/* Product Results Area */}
        <div className="flex flex-col gap-6 min-w-0">
          {/* Results Bar & Active Filter Chips */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs text-tan-dark font-medium">
              Showing <span className="font-bold text-purple-deep">{filteredProducts.length}</span> of{" "}
              <span>{initialProducts.length}</span> verified deals
            </div>

            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                {selectedCategory !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {selectedCategory}
                    <button onClick={() => setSelectedCategory("all")} className="cursor-pointer">✕</button>
                  </span>
                )}
                {priceRange !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep text-[11px] font-bold px-2.5 py-1 rounded-full">
                    Price: {priceRange}
                    <button onClick={() => setPriceRange("all")} className="cursor-pointer">✕</button>
                  </span>
                )}
                {minDiscount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-pink-100 text-rose text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {minDiscount}%+ Off
                    <button onClick={() => setMinDiscount(0)} className="cursor-pointer">✕</button>
                  </span>
                )}
                {inStockOnly && (
                  <span className="inline-flex items-center gap-1 bg-sage/15 text-sage text-[11px] font-bold px-2.5 py-1 rounded-full">
                    In Stock
                    <button onClick={() => setInStockOnly(false)} className="cursor-pointer">✕</button>
                  </span>
                )}
                {selectedStore !== "all" && (
                  <span className="inline-flex items-center gap-1 bg-mauve-100 text-purple-deep text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {selectedStore}
                    <button onClick={() => setSelectedStore("all")} className="cursor-pointer">✕</button>
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
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5">
              {filteredProducts.map((p) => {
                const discount =
                  p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents);
                const savedCents =
                  p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents
                    ? p.compareAtPriceCents - p.priceCents
                    : 0;

                const stores: ArticleStorePrice[] = Array.isArray(p.stores) ? p.stores : [];

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl sm:rounded-3xl border border-border overflow-hidden shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col justify-between group p-3 sm:p-5"
                  >
                    <div>
                      {/* Image Container with Badges */}
                      <Link href={`/deals/${p.slug}`} className="block relative mb-2.5 sm:mb-4">
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
                        <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex flex-col gap-1 sm:gap-1.5 z-10">
                          {discount ? (
                            <span className="bg-rose text-white text-[9.5px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 rounded-full shadow-xs">
                              -{discount}% OFF
                            </span>
                          ) : null}
                          {p.rank != null && (
                            <span className="bg-purple-deep text-white text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs">
                              #{p.rank} Top Pick
                            </span>
                          )}
                        </div>

                        {p.badge && (
                          <span className="absolute top-2 right-2 sm:top-3 sm:right-3 bg-pink-100 text-purple-deep text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-full shadow-xs">
                            {p.badge}
                          </span>
                        )}
                      </Link>

                      {/* Category & Title */}
                      <div className="flex items-center justify-between gap-1.5 sm:gap-2 mb-1 sm:mb-1.5">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-rose">
                          {p.category}
                        </span>
                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full ${
                            p.inStock ? "bg-sage/15 text-sage" : "bg-red-100 text-red-600"
                          }`}
                        >
                          {p.inStock ? "In Stock" : "Out of Stock"}
                        </span>
                      </div>

                      <Link href={`/deals/${p.slug}`} className="block group/title mb-1 sm:mb-1.5">
                        <h3 className="font-heading text-xs sm:text-base font-bold text-purple-deep group-hover/title:text-rose transition-colors line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                      </Link>

                      {p.subtitle && (
                        <p className="text-[11px] sm:text-xs text-tan-dark line-clamp-1 mb-2 sm:mb-3">{p.subtitle}</p>
                      )}

                      {/* Pricing & Savings */}
                      <div className="flex items-baseline gap-1.5 sm:gap-2.5 my-2 sm:my-3 p-2 sm:p-3 rounded-xl bg-mauve-50/50 border border-border/60">
                        <span className="font-heading font-bold text-sm sm:text-xl text-rose">
                          {formatPrice(p.priceCents)}
                        </span>
                        {p.compareAtPriceCents ? (
                          <span className="text-[11px] sm:text-xs text-tan line-through">
                            {formatPriceFixed(p.compareAtPriceCents)}
                          </span>
                        ) : null}
                        {savedCents > 0 && (
                          <span className="hidden sm:inline-block ml-auto text-[10.5px] font-bold text-sage bg-sage/15 px-2 py-0.5 rounded-md">
                            Save {formatPriceFixed(savedCents)}
                          </span>
                        )}
                      </div>

                      {/* Store availability badges */}
                      {stores.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-2.5 sm:mb-4">
                          {stores.slice(0, 2).map((st, idx) => (
                            <a
                              key={st.id || idx}
                              href={st.url}
                              target="_blank"
                              rel="noopener noreferrer sponsored"
                              className="text-[9.5px] sm:text-[10.5px] font-medium bg-mauve-100 hover:bg-mauve-200 text-purple-deep px-1.5 sm:px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1"
                            >
                              <span>{st.storeName}</span>
                              {st.price && <span className="font-bold">{st.price}</span>}
                              <span className="text-[9px]">↗</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1.5 sm:gap-2 pt-2 border-t border-border">
                      <Link
                        href={`/deals/${p.slug}`}
                        className="flex-1 text-center py-1.5 sm:py-2.5 px-2 sm:px-4 rounded-xl bg-purple-deep hover:bg-purple-deep/90 text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs"
                      >
                        Details
                      </Link>
                      {p.affiliateUrl && (
                        <a
                          href={p.affiliateUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="py-1.5 sm:py-2.5 px-2.5 sm:px-3 rounded-xl bg-rose hover:bg-rose-dark text-white text-[11px] sm:text-xs font-bold transition-all shadow-xs"
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
          {viewMode === "list" && (
            <div className="flex flex-col gap-4">
              {filteredProducts.map((p) => {
                const discount =
                  p.discountPercent ?? calculateDiscountPercent(p.priceCents, p.compareAtPriceCents);
                const savedCents =
                  p.compareAtPriceCents && p.compareAtPriceCents > p.priceCents
                    ? p.compareAtPriceCents - p.priceCents
                    : 0;

                const stores: ArticleStorePrice[] = Array.isArray(p.stores) ? p.stores : [];

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-3xl border border-border p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col md:flex-row items-center gap-6 group"
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
                              href={st.url}
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
                          <span className="text-xs font-bold text-sage block mt-0.5">
                            Save {formatPriceFixed(savedCents)}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col w-full gap-2">
                        <Link
                          href={`/deals/${p.slug}`}
                          className="w-full text-center py-2.5 px-4 rounded-xl bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold transition-all shadow-xs"
                        >
                          View Review & Deals
                        </Link>
                        {p.affiliateUrl && (
                          <a
                            href={p.affiliateUrl}
                            target="_blank"
                            rel="noopener noreferrer sponsored"
                            className="w-full text-center py-2 px-3 rounded-xl border border-rose text-rose hover:bg-rose hover:text-white text-xs font-bold transition-all"
                          >
                            Buy on Retailer ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* EMPTY STATE */}
          {filteredProducts.length === 0 && (
            <div className="bg-white border border-border rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep mb-2">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-heading text-xl font-bold text-purple-deep">
                No matching deals found
              </h3>
              <p className="text-sm text-tan-dark max-w-md">
                We couldn&apos;t find any deals matching your selected search query or filters. Try clearing some filters to see more results.
              </p>
              <button
                onClick={resetAllFilters}
                className="mt-2 bg-rose text-white px-6 py-2.5 rounded-full text-xs font-bold shadow-md hover:bg-rose-dark transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
