"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";
import type { posts } from "@/db/schema";

type Post = typeof posts.$inferSelect;

interface Props {
  articles: Post[];
  categoryTitle?: string;
}

export default function ArticleCarousel({ articles, categoryTitle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [articles]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const { clientWidth } = scrollRef.current;
    const scrollAmount = direction === "left" ? -clientWidth * 0.8 : clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (!articles || articles.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Header with Title and Scroll Arrows */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-rose">
            In-Depth Guides & Reviews
          </span>
          <h2 className="font-heading text-xl md:text-2xl text-purple-deep mt-0.5">
            {categoryTitle ? `${categoryTitle} Reviews` : "Featured Buying Guides"}
          </h2>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            aria-label="Previous articles"
            className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-purple-deep shadow-sm hover:bg-mauve-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            aria-label="Next articles"
            className="w-9 h-9 rounded-full border border-border bg-white flex items-center justify-center text-purple-deep shadow-sm hover:bg-mauve-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel Track */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex gap-5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scrollbar-none no-scrollbar -mx-2 px-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {articles.map((article) => (
          <article
            key={article.id}
            className="snap-start shrink-0 w-[290px] sm:w-[340px] md:w-[380px] bg-white rounded-2xl border border-border overflow-hidden shadow-[var(--shadow-card)] hover:shadow-md transition-all flex flex-col group"
          >
            {/* Image */}
            <Link href={`/blog/${article.slug}`} className="block relative aspect-[16/10] overflow-hidden bg-mauve-50">
              <ImageSlot
                imageUrl={article.imageUrl}
                label={article.imageLabel || article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <span className="absolute top-3 left-3 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-deep/90 text-white backdrop-blur-sm shadow-sm">
                {article.topicLabel || article.category}
              </span>
            </Link>

            {/* Content */}
            <div className="p-5 flex-1 flex flex-col justify-between gap-3">
              <div>
                <Link href={`/blog/${article.slug}`} className="block">
                  <h3 className="font-heading text-lg text-purple-deep group-hover:text-rose transition-colors line-clamp-2 leading-snug">
                    {article.title}
                  </h3>
                </Link>
                <p className="text-xs text-tan-dark line-clamp-2 mt-2 leading-relaxed">
                  {article.excerpt}
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border text-xs">
                <span className="text-tan-dark font-medium">By {article.author}</span>
                <Link
                  href={`/blog/${article.slug}`}
                  className="font-bold text-rose hover:text-purple-deep flex items-center gap-1 transition-colors"
                >
                  Read Review →
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
