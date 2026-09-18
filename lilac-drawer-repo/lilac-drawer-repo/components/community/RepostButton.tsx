"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleRepost } from "@/lib/community-actions";

export default function RepostButton({
  postId,
  initialReposted,
  initialCount,
  isLoggedIn,
}: {
  postId: number;
  initialReposted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
}) {
  const [reposted, setReposted] = useState(initialReposted);
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
    if (isPending) return;

    const nextReposted = !reposted;
    setReposted(nextReposted);
    setCount((c) => (nextReposted ? c + 1 : Math.max(0, c - 1)));
    if (nextReposted) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }

    startTransition(async () => {
      try {
        const result = await toggleRepost(postId);
        setReposted(result.reposted);
        setCount(result.repostCount);
      } catch {
        setReposted(!nextReposted);
        setCount((c) => (nextReposted ? Math.max(0, c - 1) : c + 1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-pressed={reposted}
      title={reposted ? "Undo repost" : "Repost"}
      className={`group inline-flex items-center gap-1.5 py-1 transition-colors duration-200 cursor-pointer select-none font-semibold text-sm ${
        reposted
          ? "text-emerald-700 font-bold"
          : "text-tan-dark hover:text-emerald-700"
      }`}
    >
      <svg
        className={`w-4.5 h-4.5 transition-transform duration-300 ease-out group-hover:rotate-180 group-hover:scale-125 ${
          animating ? "animate-repost-spin" : ""
        } ${reposted ? "stroke-emerald-700 stroke-[2.2]" : "stroke-current"}`}
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.9}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M4 12v-2a4 4 0 0 1 4-4h12" />
        <path d="M16 2l4 4-4 4" />
        <path d="M20 12v2a4 4 0 0 1-4 4H4" />
        <path d="M8 22l-4-4 4-4" />
      </svg>
      <span className="text-[13.5px] tabular-nums tracking-tight transition-colors duration-200">{count}</span>
    </button>
  );
}
