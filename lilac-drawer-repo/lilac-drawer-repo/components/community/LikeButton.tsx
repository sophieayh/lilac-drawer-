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
      className={`flex items-center gap-1.5 ${liked ? "text-rose" : "text-tan"}`}
    >
      <span aria-hidden="true">{liked ? "♥" : "♡"}</span>
      <span>{count}</span>
    </button>
  );
}
