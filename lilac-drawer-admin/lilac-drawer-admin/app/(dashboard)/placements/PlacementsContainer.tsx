"use client";

import { useState } from "react";
import type { posts, products } from "@/db/schema";
import PlacementBoard from "./PlacementBoard";
import ProductPlacementBoard from "./ProductPlacementBoard";

type Post = typeof posts.$inferSelect;
type Product = typeof products.$inferSelect;

export default function PlacementsContainer({
  initialPosts,
  initialProducts,
  defaultTab = "articles",
}: {
  initialPosts: Post[];
  initialProducts: Product[];
  defaultTab?: "articles" | "products";
}) {
  const [activeTab, setActiveTab] = useState<"articles" | "products">(defaultTab);

  return (
    <div className="flex flex-col gap-6">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-heading text-2xl text-purple-deep">Site Placements & Layout</h1>
          <p className="text-sm text-tan-dark mt-1">
            Drag and drop articles and products into site sections to control where they appear across the live store.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-mauve-100 rounded-xl border border-border/60 self-start">
          <button
            type="button"
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "articles"
                ? "bg-white text-purple-deep shadow-sm"
                : "text-tan-dark hover:text-purple-deep"
            }`}
          >
            <span>📝</span>
            <span>Articles</span>
            <span className="text-[10px] bg-mauve-50 text-purple-deep px-1.5 py-0.5 rounded-full font-bold">
              {initialPosts.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("products")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "products"
                ? "bg-white text-purple-deep shadow-sm"
                : "text-tan-dark hover:text-purple-deep"
            }`}
          >
            <span>🛍️</span>
            <span>Products & Deals</span>
            <span className="text-[10px] bg-pink-100 text-rose px-1.5 py-0.5 rounded-full font-bold">
              {initialProducts.length}
            </span>
          </button>
        </div>
      </div>

      {/* Content based on Active Tab */}
      {activeTab === "articles" ? (
        <PlacementBoard initialPosts={initialPosts} hideHeader={true} />
      ) : (
        <ProductPlacementBoard initialProducts={initialProducts} />
      )}
    </div>
  );
}
