"use client";

import { useEffect, useCallback, useState, useRef } from "react";
import { createPortal } from "react-dom";

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
  const [mounted, setMounted] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const resetZoom = useCallback(() => setZoom(1), []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (zoom > 1) {
          resetZoom();
        } else {
          onClose();
        }
      } else if (e.key === "+" || e.key === "=") {
        setZoom((z) => Math.min(z + 0.3, 3));
      } else if (e.key === "-") {
        setZoom((z) => Math.max(z - 0.3, 0.7));
      } else if (e.key === "0") {
        resetZoom();
      }
    },
    [onClose, zoom, resetZoom]
  );

  useEffect(() => {
    if (!isOpen) {
      resetZoom();
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, handleKeyDown, resetZoom]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleNativeFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current) {
          await containerRef.current.requestFullscreen();
          setIsFullscreen(true);
        }
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch {
      // Fullscreen API may be blocked or unsupported
    }
  };

  if (!isOpen || !imageUrl || !mounted) return null;

  return createPortal(
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999999] w-screen h-screen min-w-full min-h-full flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200 select-none overflow-hidden"
      style={{ top: 0, left: 0, right: 0, bottom: 0 }}
      onClick={() => {
        if (zoom > 1) {
          resetZoom();
        } else {
          onClose();
        }
      }}
    >
      {/* Modal Toolbar (Top Controls) */}
      <div
        className="fixed top-4 right-4 flex items-center gap-2 z-[1000000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Zoom In */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(z + 0.3, 3))}
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
          title="Zoom In (+)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
          </svg>
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(z - 0.3, 0.7))}
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
          title="Zoom Out (-)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
          </svg>
        </button>

        {/* Fullscreen Mode Toggle */}
        <button
          type="button"
          onClick={toggleNativeFullscreen}
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
          title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
        >
          {isFullscreen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
          )}
        </button>

        {/* Open Original */}
        <a
          href={imageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer backdrop-blur-xs"
          title="Open original image in new tab"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
          </svg>
        </a>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all cursor-pointer backdrop-blur-xs ml-1"
          title="Close (Esc)"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Caption / Title */}
      {title && (
        <div className="fixed top-4 left-6 text-white/90 text-sm font-semibold max-w-[60vw] truncate pointer-events-none z-[1000000]">
          {title}
        </div>
      )}

      {/* Main Image Display Area */}
      <div
        className="relative max-w-[96vw] max-h-[88vh] flex items-center justify-center overflow-auto"
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={() => setZoom((z) => (z > 1 ? 1 : 1.8))}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title || "Enlarged preview"}
          style={{
            transform: `scale(${zoom})`,
            transition: "transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          className="max-w-[96vw] max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl cursor-zoom-in"
          title="Double click to toggle zoom"
        />
      </div>

      {/* Bottom Hint */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-xs font-medium bg-black/60 px-3.5 py-1.5 rounded-full backdrop-blur-xs pointer-events-none z-[1000000]">
        {zoom !== 1 ? `Zoom: ${Math.round(zoom * 100)}% (Click or Esc to reset)` : "Double click or use buttons to zoom • Esc to close"}
      </div>
    </div>,
    document.body
  );
}
