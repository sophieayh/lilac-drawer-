"use client";

import { useState, useMemo, useCallback } from "react";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import ImageSlot from "@/components/ImageSlot";

interface PostImageMediaProps {
  imageUrl?: string | null;
  images?: string[] | null;
  imageLabel?: string | null;
  className?: string;
  maxHeight?: string;
}

export default function PostImageMedia({
  imageUrl,
  images,
  imageLabel,
  className = "",
  maxHeight = "max-h-[580px]",
}: PostImageMediaProps) {
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Touch swipe state for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const imageList = useMemo(() => {
    if (images && images.length > 0) return images;
    if (imageUrl) return [imageUrl];
    return [];
  }, [images, imageUrl]);

  const total = imageList.length;

  const nextSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const prevSlide = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 45) {
      nextSlide();
    } else if (distance < -45) {
      prevSlide();
    }
  };

  if (imageList.length === 0 && !imageLabel) return null;

  // Case 0: No image URL, but imageLabel exists (placeholder slot)
  if (imageList.length === 0 && imageLabel) {
    return (
      <div className={`rounded-2xl overflow-hidden border border-border/80 bg-mauve-50/40 my-2.5 ${className}`}>
        <ImageSlot
          label={imageLabel || "Post Image"}
          className="w-full h-[280px]"
          shape="rounded"
          radius={16}
          tone="mauve"
        />
      </div>
    );
  }

  return (
    <>
      {/* 1 Image: Single natural photo view */}
      {total === 1 && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setActiveImage(imageList[0]);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              setActiveImage(imageList[0]);
            }
          }}
          className={`rounded-2xl overflow-hidden border border-border/80 bg-mauve-50/40 flex items-center justify-center my-2.5 group/postimg cursor-pointer relative select-none ${className}`}
          title="Click to view full screen"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageList[0]}
            alt={imageLabel || "Post image"}
            className={`w-auto max-w-full ${maxHeight} object-contain rounded-2xl group-hover/postimg:scale-[1.01] group-hover/postimg:brightness-95 transition-all duration-200`}
          />
          <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover/postimg:opacity-100 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-lg pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            <span>Full Screen</span>
          </div>
        </div>
      )}

      {/* Multiple Images (2, 3 or more): Banner-style Carousel Slider */}
      {total > 1 && (
        <div
          dir="ltr"
          className={`relative rounded-2xl overflow-hidden border border-border/80 bg-mauve-50/40 my-2.5 group/carousel select-none shadow-xs ${className}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Slide Track */}
          <div className="relative overflow-hidden w-full h-[300px] sm:h-[360px] md:h-[400px] bg-mauve-50/20">
            <div
              className="flex w-full h-full transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {imageList.map((url, idx) => (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveImage(url);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      setActiveImage(url);
                    }
                  }}
                  className="w-full h-full shrink-0 flex items-center justify-center cursor-pointer relative bg-mauve-50/10 group/slide"
                  title="Click to view full screen"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`${imageLabel || "Post image"} ${idx + 1}`}
                    className="w-full h-full object-contain p-1 group-hover/slide:scale-[1.01] transition-transform duration-200"
                  />
                  {/* Full screen indicator overlay on hover */}
                  <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1 rounded-xl opacity-0 group-hover/slide:opacity-100 transition-opacity duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-md pointer-events-none">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                    <span>Full Screen</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Arrows (Prev & Next) */}
          <button
            type="button"
            onClick={prevSlide}
            aria-label="Previous image"
            title="Previous image"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-purple-deep shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover/carousel:opacity-100 z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          <button
            type="button"
            onClick={nextSlide}
            aria-label="Next image"
            title="Next image"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/90 hover:bg-white text-purple-deep shadow-md backdrop-blur-xs flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover/carousel:opacity-100 z-10"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Photo Counter Pill (e.g. 1/3) */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs text-white text-xs font-semibold px-2.5 py-1 rounded-full pointer-events-none shadow-sm z-10">
            {currentIndex + 1} / {total}
          </div>

          {/* Pagination Indicator Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 backdrop-blur-xs px-2.5 py-1.5 rounded-full pointer-events-auto z-10">
            {imageList.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(i);
                }}
                className={`rounded-full transition-all duration-200 cursor-pointer ${
                  i === currentIndex
                    ? "w-4 h-1.5 bg-white shadow-xs"
                    : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
                }`}
                title={`Photo ${i + 1}`}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {activeImage && (
        <ImageLightboxModal
          isOpen={!!activeImage}
          imageUrl={activeImage}
          title={imageLabel || "Community Photo"}
          onClose={() => setActiveImage(null)}
        />
      )}
    </>
  );
}
