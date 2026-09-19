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
        onClick={(e) => {
          if (imageUrl) {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }
        }}
        className={`rounded-2xl overflow-hidden border border-border/80 bg-mauve-50/40 flex items-center justify-center mb-3 group/postimg cursor-pointer relative ${className}`}
        title={imageUrl ? "Click to view full size" : undefined}
      >
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={imageLabel || "Post image"}
              className={`w-auto max-w-full ${maxHeight} object-contain rounded-2xl group-hover/postimg:opacity-95 transition-all duration-200`}
            />
            {/* Expand Icon Hint */}
            <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-xs text-white p-1.5 rounded-xl opacity-0 group-hover/postimg:opacity-100 transition-opacity pointer-events-none">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
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
          title={imageLabel || "Post image"}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
