"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import ImageSlot from "@/components/ImageSlot";

export interface BannerItem {
  id: number;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  imageLabel?: string | null;
  linkUrl: string;
  placement?: string;
  sortOrder?: number;
  isActive?: boolean;
  badgeText?: string | null;
}

export default function CommunityAdBanner({ banners }: { banners: BannerItem[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const total = banners.length;

  const nextSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback(() => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Auto-scroll effect: every 4.5 seconds when not paused and more than 1 banner
  useEffect(() => {
    if (total <= 1 || isPaused) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [total, isPaused, nextSlide]);

  if (!banners || total === 0) {
    return null;
  }

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    setIsPaused(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  return (
    <div
      className="py-4 border-b border-border select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="relative rounded-2xl overflow-hidden border border-border bg-white shadow-xs group">
        {/* Banner Slides Carousel Track */}
        <div className="relative overflow-hidden w-full min-h-[340px] sm:min-h-[380px] md:min-h-[420px]">
          {banners.map((ad, idx) => {
            const isExternal = ad.linkUrl.startsWith("http://") || ad.linkUrl.startsWith("https://");
            const isCurrent = idx === currentIndex;

            const SlideWrapper = isExternal ? "a" : Link;
            const slideProps = isExternal
              ? { href: ad.linkUrl, target: "_blank", rel: "noopener noreferrer" }
              : { href: ad.linkUrl };

            return (
              <SlideWrapper
                key={ad.id}
                {...slideProps}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out flex flex-col justify-end cursor-pointer ${
                  isCurrent
                    ? "opacity-100 translate-x-0 pointer-events-auto z-10"
                    : idx < currentIndex
                    ? "opacity-0 -translate-x-full pointer-events-none z-0"
                    : "opacity-0 translate-x-full pointer-events-none z-0"
                }`}
              >
                {/* Background Image & Solid Dark Overlay */}
                <div className="absolute inset-0 w-full h-full bg-purple-deep">
                  {ad.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ad.imageUrl}
                      alt={ad.imageLabel || ad.title}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <ImageSlot
                      label={ad.imageLabel || ad.title}
                      className="w-full h-full"
                      tone="purple"
                    />
                  )}
                  {/* Solid dark tint for clean legibility */}
                  <div className="absolute inset-0 bg-purple-deep/75" />
                </div>

                {/* Badge Tag */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                  <span className="text-xs uppercase tracking-wider font-bold text-purple-deep bg-cream/95 backdrop-blur-md px-3 py-1 rounded-full shadow-xs border border-purple-deep/10">
                    {ad.badgeText || "Exclusive Deal"}
                  </span>
                </div>

                {/* Content Overlay */}
                <div className="relative z-20 p-6 sm:p-8 text-white max-w-[680px]">
                  <h3 className="font-heading text-2xl sm:text-3xl md:text-[32px] font-bold leading-tight text-white drop-shadow-sm mb-2 line-clamp-2">
                    {ad.title}
                  </h3>
                  {ad.subtitle && (
                    <p className="text-sm sm:text-base text-pink-100 font-medium line-clamp-3 leading-relaxed drop-shadow-xs max-w-[540px]">
                      {ad.subtitle}
                    </p>
                  )}
                </div>
              </SlideWrapper>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows (visible on hover or focus when > 1 banner) */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous advertisement"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prevSlide();
              }}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-cream/85 hover:bg-cream text-purple-deep backdrop-blur-sm flex items-center justify-center font-bold text-base shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next advertisement"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                nextSlide();
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 w-9 h-9 rounded-full bg-cream/85 hover:bg-cream text-purple-deep backdrop-blur-sm flex items-center justify-center font-bold text-base shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
            >
              ›
            </button>

            {/* Pagination Indicators / Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-purple-deep/40 backdrop-blur-xs px-3 py-1.5 rounded-full">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setCurrentIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentIndex ? "w-6 bg-rose" : "w-2 bg-white/60 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
