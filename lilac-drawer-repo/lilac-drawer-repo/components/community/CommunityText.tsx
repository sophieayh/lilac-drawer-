"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseCommunityText } from "@/lib/link-moderation";

interface CommunityTextProps {
  text: string;
  className?: string;
  linkClassName?: string;
  navigateOnCardClick?: string; // Optional URL to navigate to when clicking background text (e.g. `/community/post/123`)
}

export default function CommunityText({
  text,
  className = "",
  linkClassName = "text-rose font-medium underline decoration-rose/40 hover:decoration-rose hover:text-plum break-all transition-colors",
  navigateOnCardClick,
}: CommunityTextProps) {
  const router = useRouter();

  const segments = useMemo(() => parseCommunityText(text), [text]);

  const handleContainerClick = (e: React.MouseEvent) => {
    if (!navigateOnCardClick) return;

    // If click happened on an anchor tag or inside one, let the link handle it
    const target = e.target as HTMLElement | null;
    if (target?.closest("a")) {
      return;
    }

    // If user is selecting text (e.g. dragging mouse to copy), avoid navigation
    const selection = typeof window !== "undefined" ? window.getSelection() : null;
    if (selection && selection.toString().length > 0) {
      return;
    }

    router.push(navigateOnCardClick);
  };

  const hasOnlyText = segments.length === 1 && segments[0].type === "text";

  // If there are no links and no container navigation, render plain element
  if (hasOnlyText && !navigateOnCardClick) {
    return <p className={className}>{text}</p>;
  }

  const content = segments.map((seg, idx) => {
    if (seg.type === "link") {
      return (
        <Link
          key={idx}
          href={seg.href}
          onClick={(e) => {
            // Prevent triggering card click navigation
            e.stopPropagation();
          }}
          className={linkClassName}
        >
          {seg.content}
        </Link>
      );
    }
    return <React.Fragment key={idx}>{seg.content}</React.Fragment>;
  });

  return (
    <p
      onClick={navigateOnCardClick ? handleContainerClick : undefined}
      className={className}
    >
      {content}
    </p>
  );
}
