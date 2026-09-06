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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isPending) return; // ignore rapid double-clicks mid-request

    // Optimistic update — reverted if the server call fails.
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => (nextLiked ? c + 1 : Math.max(0, c - 1)));

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
      className={`flex items-center gap-1.5 transition-colors cursor-pointer ${liked ? "text-rose" : "text-tan hover:text-rose"}`}
    >
      <svg
        className={`w-4 h-4 transition-transform ${liked ? "fill-rose stroke-rose scale-110" : "fill-none stroke-current"}`}
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
      <span>{count}</span>
    </button>
  );
}
