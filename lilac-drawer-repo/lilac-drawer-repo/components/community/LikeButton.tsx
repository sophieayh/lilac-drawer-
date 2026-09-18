"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleLike } from "@/lib/community-actions";

export default function LikeButton({
  postId,
  initialLiked,
  initialCount,
  isLoggedIn,
}: {
  postId: number;
  initialLiked: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/login?redirect=/community");
      return;
    }
    if (isPending) return; // ignore rapid double-clicks mid-request

    // Optimistic update — reverted if the server call fails.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));
    if (nextLiked) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }

    startTransition(async () => {
      try {
        const result = await toggleLike(postId);
        setLiked(result.liked);
        setCount(result.likeCount);
      } catch {
        // revert on failure
        setLiked(!nextLiked);
        setCount((c) => (nextLiked ? Math.max(0, c - 1) : c + 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={liked}
      title={liked ? "Unlike" : "Like"}
      className={`group inline-flex items-center gap-1.5 py-1 transition-colors duration-200 cursor-pointer select-none font-semibold text-sm ${
        liked
          ? "text-rose font-bold"
          : "text-tan-dark hover:text-rose"
      }`}
    >
      <svg
        className={`w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-125 ${
          animating ? "animate-heart-pop" : ""
        } ${liked ? "fill-rose stroke-rose" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={1.9}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span className="text-[13.5px] tabular-nums tracking-tight transition-colors duration-200">{count}</span>
    </button>
  );
}
