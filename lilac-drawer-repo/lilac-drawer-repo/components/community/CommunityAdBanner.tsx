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
        <div className="relative overflow-hidden w-full min-h-[170px] sm:min-h-[190px] md:min-h-[210px]">
          {banners.map((ad, idx) => {
            const isExternal = ad.linkUrl.startsWith("http://") || ad.linkUrl.startsWith("https://");
            const isCurrent = idx === currentIndex;

            return (
              <div
                key={ad.id}
                className={`absolute inset-0 w-full h-full transition-all duration-700 ease-in-out flex flex-col justify-end ${
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
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-1000 ease-out"
                    />
                  ) : (
                    <ImageSlot
                      label={ad.imageLabel || ad.title}
                      className="w-full h-full"
                      tone="purple"
                    />
                  )}
                  {/* Solid dark tint for clean legibility without gradient */}
                  <div className="absolute inset-0 bg-purple-deep/80" />
                </div>

                {/* Badge Tag */}
                <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
                  <span className="text-[10.5px] uppercase tracking-wider font-bold text-purple-deep bg-cream/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-xs border border-purple-deep/10">
                    {ad.badgeText || "Sponsored"}
                  </span>
                </div>

                {/* Content Overlay & Direct Click Area */}
                <div className="relative z-20 p-4 sm:p-6 text-white flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                  <div className="max-w-[540px]">
                    <h3 className="font-heading text-lg sm:text-xl md:text-2xl font-bold leading-tight text-white drop-shadow-sm mb-1 line-clamp-1 sm:line-clamp-2">
                      {ad.title}
                    </h3>
                    {ad.subtitle && (
                      <p className="text-xs sm:text-sm text-pink-100 font-medium line-clamp-2 leading-snug drop-shadow-xs max-w-[460px]">
                        {ad.subtitle}
                      </p>
                    )}
                  </div>

                  {/* CTA Link Button */}
                  <div className="shrink-0 self-start sm:self-end">
                    {isExternal ? (
                      <a
                        href={ad.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose text-white text-xs sm:text-sm font-semibold hover:bg-rose-dark active:scale-95 transition-all shadow-md hover:shadow-lg"
                      >
                        <span>Shop Now</span>
                        <span className="text-sm">↗</span>
                      </a>
                    ) : (
                      <Link
                        href={ad.linkUrl}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-rose text-white text-xs sm:text-sm font-semibold hover:bg-rose-dark active:scale-95 transition-all shadow-md hover:shadow-lg"
                      >
                        <span>View Deal</span>
                        <span className="text-sm">→</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Navigation Arrows (visible on hover or focus when > 1 banner) */}
        {total > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous advertisement"
              onClick={prevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-cream/80 hover:bg-cream text-purple-deep backdrop-blur-sm flex items-center justify-center font-bold text-sm shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
            >
              ‹
            </button>
            <button
              type="button"
              aria-label="Next advertisement"
              onClick={nextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-cream/80 hover:bg-cream text-purple-deep backdrop-blur-sm flex items-center justify-center font-bold text-sm shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105"
            >
              ›
            </button>

            {/* Pagination Indicators / Dots */}
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-purple-deep/40 backdrop-blur-xs px-2.5 py-1 rounded-full">
              {banners.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Go to slide ${i + 1}`}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentIndex ? "w-5 bg-rose" : "w-1.5 bg-white/60 hover:bg-white"
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
