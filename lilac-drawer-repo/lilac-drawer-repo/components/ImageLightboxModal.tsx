"use client";

import { useEffect, useCallback } from "react";

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export default function ImageLightboxModal({
  isOpen,
  imageUrl,
  title,
  onClose,
}: ImageLightboxModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Modal Toolbar */}
      <div
        className="absolute top-4 right-4 flex items-center gap-3 z-60"
        onClick={(e) => e.stopPropagation()}
      >
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
          title="Open original image"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>

        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all cursor-pointer backdrop-blur-xs"
          title="Close (Esc)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {title && (
        <div className="absolute top-4 left-6 text-white/90 text-sm font-semibold max-w-[70vw] truncate pointer-events-none">
          {title}
        </div>
      )}

      {/* Image Display */}
      <div
        className="relative max-w-[92vw] max-h-[88vh] flex items-center justify-center select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || "Enlarged preview"}
          className="max-w-full max-h-[88vh] w-auto h-auto object-contain rounded-2xl shadow-2xl transition-transform"
        />
      </div>
    </div>
  );
}
