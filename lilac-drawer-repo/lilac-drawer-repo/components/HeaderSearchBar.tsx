"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import ImageSlot from "@/components/ImageSlot";
import { formatPriceFixed } from "@/lib/format";
import type { products, posts } from "@/db/schema";

type Product = typeof products.$inferSelect;
type Post = typeof posts.$inferSelect;

interface HeaderSearchBarProps {
  variant?: "desktop" | "mobile";
  onNavigate?: () => void;
  placeholder?: string;
}

export default function HeaderSearchBar({
  variant = "desktop",
  onNavigate,
  placeholder = "Show me the best...",
}: HeaderSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ products: Product[]; posts: Post[]; totalCount: number }>({
    products: [],
    posts: [],
    totalCount: 0,
  });

  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch live suggestions with debounce
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 1) {
      setResults({ products: [], posts: [], totalCount: 0 });
      setLoading(false);
      return;
    }

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`);
        if (res.ok) {
          const data = await res.json();
          setResults({
            products: data.products || [],
            posts: data.posts || [],
            totalCount: data.totalCount || 0,
          });
        }
      } catch (err) {
        console.error("Failed to fetch suggestions:", err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    setIsOpen(false);
    if (onNavigate) onNavigate();
    if (trimmed) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/search");
    }
  }

  function handleSelectResult(href: string) {
    setIsOpen(false);
    if (onNavigate) onNavigate();
    router.push(href);
  }

  const isMobile = variant === "mobile";
  const hasResults = results.products.length > 0 || results.posts.length > 0;
  const showDropdown = isOpen && query.trim().length > 0;

  return (
    <div
      ref={containerRef}
      className={`relative ${isMobile ? "w-full mb-4" : "flex-1 max-w-[440px] hidden md:block"}`}
    >
      {/* Search Input Form */}
      <form
        onSubmit={handleSubmit}
        role="search"
        className={`flex items-center gap-2.5 rounded-full px-4.5 py-2.5 border transition-all ${
          isMobile
            ? "bg-white shadow-xs border-border/70 focus-within:border-lilac"
            : "bg-mauve-50 border-transparent focus-within:border-lilac/40 focus-within:bg-white focus-within:shadow-[0_4px_16px_rgba(90,47,69,0.06)]"
        }`}
      >
        <button
          type="submit"
          aria-label="Search"
          className="text-tan-dark/70 hover:text-purple-deep transition-colors flex items-center justify-center cursor-pointer shrink-0"
        >
          {loading ? (
            <svg
              className="animate-spin w-4 h-4 text-lilac"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 256 256" fill="currentColor" aria-hidden="true">
              <path d="M232.49,215.51,185,168a92.12,92.12,0,1,0-17,17l47.53,47.54a12,12,0,0,0,17-17ZM44,112a68,68,0,1,1,68,68A68.07,68.07,0,0,1,44,112Z" />
            </svg>
          )}
        </button>

        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setIsOpen(false);
            }
          }}
          placeholder={placeholder}
          aria-label="Search the site"
          autoComplete="off"
          className="border-none bg-transparent outline-none text-sm flex-1 text-purple-deep placeholder:text-tan-dark/70 min-w-0"
        />

        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults({ products: [], posts: [], totalCount: 0 });
            }}
            aria-label="Clear search"
            className="w-5 h-5 rounded-full hover:bg-mauve-100 flex items-center justify-center text-tan-dark text-xs transition-colors cursor-pointer shrink-0"
          >
            ✕
          </button>
        )}
      </form>

      {/* Floating Suggestions Dropdown */}
      {showDropdown && (
        <div
          className={`absolute left-0 right-0 top-full mt-2 z-50 bg-white/95 backdrop-blur-md rounded-2xl border border-border shadow-[0_16px_36px_rgba(90,47,69,0.14)] overflow-hidden animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/5 ${
            isMobile ? "max-h-[60vh] overflow-y-auto" : "max-h-[520px] overflow-y-auto min-w-[380px]"
          }`}
        >
          {/* Header query summary */}
          <div className="px-4 py-2.5 bg-mauve-50/70 border-b border-border flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-deep flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-lilac rounded-full" />
              Quick Suggestions
            </span>
            <span className="text-[11px] text-tan-dark">
              Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-border text-[10px] font-semibold text-purple-deep shadow-2xs">Enter</kbd> to search all
            </span>
          </div>

          <div className="p-2 divide-y divide-border/60">
            {/* Articles Section */}
            {results.posts.length > 0 && (
              <div className="py-2">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-rose flex items-center justify-between">
                  <span>Articles & Guides ({results.posts.length})</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {results.posts.map((post) => (
                    <button
                      key={`post-${post.id}`}
                      type="button"
                      onClick={() => handleSelectResult(`/blog/${post.slug}`)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-mauve-50/80 transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-mauve-100 shrink-0 border border-border/60 flex items-center justify-center">
                        <ImageSlot
                          imageUrl={post.imageUrl}
                          label={post.imageLabel || post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-purple-deep line-clamp-1 group-hover:text-lilac transition-colors">
                          {post.title}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-rose">
                            {post.category}
                          </span>
                          <span className="text-[10px] text-tan-dark">·</span>
                          <span className="text-[10px] text-tan-dark line-clamp-1">
                            {post.excerpt}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Products & Deals Section */}
            {results.products.length > 0 && (
              <div className="py-2">
                <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-deep flex items-center justify-between">
                  <span>Products & Deals ({results.products.length})</span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  {results.products.map((product) => (
                    <button
                      key={`prod-${product.id}`}
                      type="button"
                      onClick={() => handleSelectResult(`/deals/${product.slug}`)}
                      className="w-full text-left flex items-center gap-3 p-2 rounded-xl hover:bg-mauve-50/80 transition-all group cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-mauve-100 shrink-0 border border-border/60 flex items-center justify-center">
                        <ImageSlot
                          imageUrl={product.imageUrl}
                          label={product.imageLabel || product.name}
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform p-0.5"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-purple-deep line-clamp-1 group-hover:text-lilac transition-colors">
                          {product.name}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs font-bold text-rose">
                            {formatPriceFixed(product.priceCents)}
                          </span>
                          {product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents && (
                            <span className="text-[10px] text-tan line-through">
                              {formatPriceFixed(product.compareAtPriceCents)}
                            </span>
                          )}
                          <span className="text-[10px] text-tan-dark font-medium bg-mauve-100/60 px-1.5 py-0.5 rounded">
                            {product.category}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state when no matches */}
            {!loading && !hasResults && (
              <div className="p-6 text-center space-y-1">
                <p className="text-xs font-bold text-purple-deep">No instant matches found</p>
                <p className="text-[11px] text-tan-dark">
                  Press Enter to search the full database with advanced filters.
                </p>
              </div>
            )}
          </div>

          {/* Footer View All Button */}
          <div className="p-2.5 bg-mauve-50/50 border-t border-border">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full py-2 px-3 bg-purple-deep hover:bg-lilac text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 shadow-xs cursor-pointer"
            >
              <span>See all results for &ldquo;{query}&rdquo;</span>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
