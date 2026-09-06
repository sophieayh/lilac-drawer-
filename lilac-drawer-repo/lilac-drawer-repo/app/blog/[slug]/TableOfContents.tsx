"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface TocEntry {
  id: string;
  label: string;
}

export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string>(entries[0]?.id ?? "");
  const [indicatorTop, setIndicatorTop] = useState<number>(0);
  const [indicatorHeight, setIndicatorHeight] = useState<number>(36);
  const [isReady, setIsReady] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  // Recalculate indicator position relative to container bounding box
  const updateIndicatorPosition = useCallback(() => {
    if (!activeId) return;
    const targetEl = itemRefs.current[activeId];
    const container = containerRef.current;
    if (targetEl && container) {
      const targetRect = targetEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const top = targetRect.top - containerRect.top;
      const height = targetRect.height;
      if (height > 0) {
        setIndicatorTop(top);
        setIndicatorHeight(height);
        setIsReady(true);
      }
    }
  }, [activeId]);

  useEffect(() => {
    updateIndicatorPosition();
    const raf = requestAnimationFrame(updateIndicatorPosition);
    const timer = setTimeout(updateIndicatorPosition, 100);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [activeId, updateIndicatorPosition]);

  useEffect(() => {
    if (entries.length === 0) return;

    const ids = entries.map((e) => e.id);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        ticking = false;
        const scrollY = window.scrollY;
        const windowHeight = window.innerHeight;
        const docHeight = document.documentElement.scrollHeight;

        // Collect all section elements
        const elements: { id: string; top: number; bottom: number }[] = [];
        for (const id of ids) {
          const el = document.getElementById(id);
          if (el) {
            const rect = el.getBoundingClientRect();
            elements.push({ id, top: rect.top + scrollY, bottom: rect.bottom + scrollY });
          }
        }

        if (elements.length === 0) return;

        // Bottom of page detection -> highlight last item
        if (scrollY + windowHeight >= docHeight - 120) {
          setActiveId(elements[elements.length - 1].id);
          return;
        }

        // Reading trigger line is 150px from top of viewport
        const triggerLine = scrollY + 150;

        let currentActiveId = elements[0].id;
        for (let i = 0; i < elements.length; i++) {
          if (elements[i].top <= triggerLine) {
            currentActiveId = elements[i].id;
          } else {
            break;
          }
        }

        setActiveId(currentActiveId);
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [entries]);

  function handleClick(e: React.MouseEvent<HTMLAnchorElement>, id: string) {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const topOffset = 85;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - topOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveId(id);
      window.history.replaceState(null, "", `#${id}`);
    }
  }

  if (entries.length === 0) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col gap-3 select-none">
      <div className="border-t-2 border-purple-deep pt-3 flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-wider uppercase text-purple-deep flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose animate-pulse" aria-hidden="true" />
          In this guide
        </span>
        <span className="text-[10px] text-tan-dark font-medium">
          {entries.length} sections
        </span>
      </div>

      {/* Rail Track with Animated Sliding Train Indicator */}
      <div ref={containerRef} className="relative my-1 pl-1">
        {/* Continuous vertical rail track line */}
        <div className="absolute left-[4px] top-1 bottom-1 w-[3px] bg-mauve-200/90 rounded-full" />

        {/* Sliding Train Carriage / Indicator */}
        <div
          className="absolute left-[2px] w-[7px] z-10 pointer-events-none transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col items-center"
          style={{
            transform: `translateY(${indicatorTop}px)`,
            height: `${indicatorHeight}px`,
            opacity: isReady ? 1 : 0,
            transitionProperty: "transform, height, opacity",
          }}
        >
          {/* Glowing Front Train Head (Engine) */}
          <div className="w-3.5 h-3.5 -mt-1 rounded-full bg-rose ring-2 ring-white shadow-[0_0_10px_rgba(212,112,143,0.7)] shrink-0 flex items-center justify-center animate-pulse">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
          </div>

          {/* Train Carriage Bar */}
          <div className="w-[5px] flex-1 bg-rose rounded-full shadow-[0_2px_8px_rgba(212,112,143,0.3)] my-0.5" />

          {/* Train Caboose */}
          <div className="w-2.5 h-2.5 -mb-0.5 rounded-full bg-rose ring-2 ring-white shadow-xs shrink-0" />
        </div>

        {/* Navigation Section Links */}
        <div className="flex flex-col gap-0.5">
          {entries.map((item) => {
            const isActive = activeId === item.id;
            return (
              <a
                key={item.id}
                ref={(el) => {
                  itemRefs.current[item.id] = el;
                }}
                href={`#${item.id}`}
                onClick={(e) => handleClick(e, item.id)}
                className={`pl-5 py-2 text-[13.5px] leading-snug rounded-r-lg transition-all duration-200 block ${
                  isActive
                    ? "text-purple-deep font-bold bg-mauve-100/70 translate-x-1 shadow-xs"
                    : "text-purple-deep/70 hover:text-purple-deep hover:translate-x-0.5 font-normal"
                }`}
              >
                <span className="line-clamp-2">{item.label}</span>
              </a>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
