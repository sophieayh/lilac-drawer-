"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { updateProductPlacement } from "@/lib/actions";
import type { products } from "@/db/schema";

type Product = typeof products.$inferSelect;

interface PlacementZoneConfig {
  key: keyof Product;
  title: string;
  badge: string;
  description: string;
  recommendedCount: number;
}

const PRODUCT_ZONES: PlacementZoneConfig[] = [
  {
    key: "isFeaturedHome",
    title: "Home — Featured Picks",
    badge: "Home Deals",
    description: "Featured product deals in the right sidebar list on the homepage.",
    recommendedCount: 4,
  },
  {
    key: "isTopPick",
    title: "Home — Top 10 Ranked",
    badge: "Top Picks",
    description: "Ranked items in the 'Top 10 Ranked' section on the homepage.",
    recommendedCount: 10,
  },
  {
    key: "isFeaturedDeals",
    title: "Deals — Featured Deals",
    badge: "Deals Hero",
    description: "Hero showcase deals grid at the top of the /deals page.",
    recommendedCount: 6,
  },
  {
    key: "isTodayDeal",
    title: "Deals — Today's Deals",
    badge: "Today's Deal",
    description: "Special daily limited-time deals on the /deals page.",
    recommendedCount: 4,
  },
  {
    key: "isSaleOff",
    title: "Deals — Sale Off",
    badge: "Sale Off",
    description: "Clearance and discounted sale items on the /deals page.",
    recommendedCount: 6,
  },
  {
    key: "isNewArrival",
    title: "Explore — New Arrivals",
    badge: "New Arrival",
    description: "Freshly added products in Explore's New Arrivals section.",
    recommendedCount: 6,
  },
  {
    key: "isBestSeller",
    title: "Explore — Best Sellers",
    badge: "Best Seller",
    description: "Top-selling favorite products in Explore.",
    recommendedCount: 6,
  },
  {
    key: "isExploreDeal",
    title: "Explore — Deals Grid",
    badge: "Explore Deals",
    description: "Curated deal cards across the /explore page.",
    recommendedCount: 8,
  },
  {
    key: "isRecommended",
    title: "Explore — Recommended",
    badge: "Recommended",
    description: "Hand-picked recommendations on the Explore page.",
    recommendedCount: 8,
  },
  {
    key: "isSaved",
    title: "Saved Picks",
    badge: "Saved",
    description: "Saved and curated essentials collection.",
    recommendedCount: 8,
  },
  {
    key: "isSuggested",
    title: "Suggested",
    badge: "Suggested",
    description: "Editor-suggested items across the store.",
    recommendedCount: 6,
  },
];

function formatPrice(cents: number | null | undefined): string {
  if (cents == null) return "$0.00";
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ProductPlacementBoard({ initialProducts }: { initialProducts: Product[] }) {
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [dragOverZone, setDragOverZone] = useState<string | null>(null);
  const [draggedProductId, setDraggedProductId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const categories = ["ALL", ...Array.from(new Set(initialProducts.map((p) => p.category)))];

  const filteredProducts = productsList.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase()) ||
      (p.subtitle && p.subtitle.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = activeCategory === "ALL" || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  function handleTogglePlacement(productId: number, key: string, nextValue: boolean) {
    // Optimistic UI update
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, [key]: nextValue } : p))
    );

    startTransition(async () => {
      try {
        await updateProductPlacement(productId, key, nextValue);
      } catch (err) {
        console.error("Failed to update product placement:", err);
        // Revert on error
        setProductsList(initialProducts);
      }
    });
  }

  function handleDragStart(e: React.DragEvent, productId: number) {
    setDraggedProductId(productId);
    e.dataTransfer.setData("text/plain", String(productId));
    e.dataTransfer.effectAllowed = "copyMove";
  }

  function handleDragEnd() {
    setDraggedProductId(null);
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
    const productIdStr = e.dataTransfer.getData("text/plain");
    const productId = Number(productIdStr) || draggedProductId;
    if (!productId) return;

    handleTogglePlacement(productId, zoneKey, true);
    setDraggedProductId(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* Left Column: Draggable Products Pool */}
        <div className="bg-white rounded-2xl border border-border p-4.5 shadow-sm sticky top-6 max-h-[calc(100vh-140px)] flex flex-col">
          <div className="mb-3.5">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-heading text-base text-purple-deep flex items-center gap-2">
                <span>All Products</span>
                <span className="text-xs bg-mauve-100 text-purple-deep px-2 py-0.5 rounded-full font-bold">
                  {filteredProducts.length}
                </span>
              </h2>
              <span className="text-[11px] text-tan uppercase tracking-wide">Drag to assign ⠿</span>
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
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

          {/* Products List */}
          <div className="overflow-y-auto pr-1 flex flex-col gap-2 flex-1 divide-y divide-border/40">
            {filteredProducts.map((p) => {
              const activePlacements = PRODUCT_ZONES.filter((z) => Boolean(p[z.key]));
              const isBeingDragged = draggedProductId === p.id;

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
                        className="w-11 h-11 rounded-lg object-cover border border-border shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-pink-100/60 border border-border shrink-0 flex items-center justify-center text-[10px] text-purple-deep font-bold">
                        {p.category.slice(0, 3)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-purple-deep leading-snug line-clamp-2">
                        {p.name}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-bold text-rose">
                          {formatPrice(p.priceCents)}
                        </span>
                        {p.compareAtPriceCents && (
                          <span className="text-[10px] text-tan line-through">
                            {formatPrice(p.compareAtPriceCents)}
                          </span>
                        )}
                        <span className="text-[10px] text-tan-dark">· {p.category}</span>
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

            {filteredProducts.length === 0 && (
              <div className="text-center py-8 text-xs text-tan">No products found.</div>
            )}
          </div>
        </div>

        {/* Right Area: Placement Drop Zones (Large Cards) */}
        <div className="grid md:grid-cols-2 gap-5">
          {PRODUCT_ZONES.map((zone) => {
            const assignedProducts = productsList.filter((p) => Boolean(p[zone.key]));
            const isOver = dragOverZone === zone.key;
            const isFull = assignedProducts.length >= zone.recommendedCount;

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
                          assignedProducts.length === 0
                            ? "bg-sand text-tan-dark"
                            : isFull
                              ? "bg-mauve-100 text-purple-deep"
                              : "bg-pink-100 text-rose"
                        }`}
                      >
                        {assignedProducts.length} / {zone.recommendedCount}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-tan-dark mb-4 leading-relaxed">{zone.description}</p>

                  {/* Assigned Products in this Zone */}
                  <div className="flex flex-col gap-2 mb-3 max-h-[280px] overflow-y-auto pr-1">
                    {assignedProducts.map((product, idx) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-mauve-50/70 border border-border group hover:bg-mauve-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-heading font-bold text-purple-deep/40 w-4 text-center">
                            {product.rank != null ? `#${product.rank}` : idx + 1}
                          </span>
                          {product.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={product.imageUrl}
                              alt=""
                              className="w-8 h-8 rounded-lg object-cover shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-pink-100 shrink-0 flex items-center justify-center text-[9px] font-bold text-purple-deep">
                              {product.category.slice(0, 3)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <Link
                              href={`/products/${product.id}`}
                              className="text-xs font-semibold text-purple-deep hover:underline truncate block"
                            >
                              {product.name}
                            </Link>
                            <div className="flex items-center gap-1.5 text-[10px]">
                              <span className="font-bold text-rose">{formatPrice(product.priceCents)}</span>
                              <span className="text-tan truncate">{product.category}</span>
                            </div>
                          </div>
                        </div>

                        {/* Quick Remove Button */}
                        <button
                          type="button"
                          onClick={() => handleTogglePlacement(product.id, zone.key, false)}
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
                    <span>Release to drop product here 🎯</span>
                  ) : (
                    <div className="flex items-center justify-center gap-1.5">
                      <span>⬇ Drop product card here</span>
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
