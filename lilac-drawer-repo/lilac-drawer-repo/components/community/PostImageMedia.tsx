"use client";

import { useState } from "react";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import ImageSlot from "@/components/ImageSlot";

interface PostImageMediaProps {
  imageUrl?: string | null;
  imageLabel?: string | null;
  className?: string;
  maxHeight?: string;
}

export default function PostImageMedia({
  imageUrl,
  imageLabel,
  className = "",
  maxHeight = "max-h-[580px]",
}: PostImageMediaProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!imageUrl && !imageLabel) return null;

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={(e) => {
          if (imageUrl) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        onKeyDown={(e) => {
          if (imageUrl && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        className={`rounded-2xl overflow-hidden border border-border/80 bg-mauve-50/40 flex items-center justify-center my-2.5 group/postimg cursor-pointer relative select-none ${className}`}
        title={imageUrl ? "Click to view full screen" : undefined}
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageLabel || "Post image"}
              className={`w-auto max-w-full ${maxHeight} object-contain rounded-2xl group-hover/postimg:scale-[1.01] group-hover/postimg:brightness-95 transition-all duration-200`}
            />
            {/* Expand Fullscreen Icon Hint */}
            <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white px-2.5 py-1.5 rounded-xl opacity-0 group-hover/postimg:opacity-100 transition-all duration-200 flex items-center gap-1.5 text-xs font-semibold shadow-lg pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
              </svg>
              <span>Full Screen</span>
            </div>
          </>
        ) : (
          <ImageSlot
            label={imageLabel || "Post Image"}
            className="w-full h-[280px]"
            shape="rounded"
            radius={16}
            tone="mauve"
          />
        )}
      </div>

      {imageUrl && (
        <ImageLightboxModal
          isOpen={isOpen}
          imageUrl={imageUrl}
          title={imageLabel || "Community Photo"}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
