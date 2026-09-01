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
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (isPending) return;

    const nextReposted = !reposted;
    setReposted(nextReposted);
    setCount((c) => (nextReposted ? c + 1 : Math.max(0, c - 1)));

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
      className={`flex items-center gap-1.5 ${reposted ? "text-sage" : "text-tan"}`}
    >
      <span aria-hidden="true">↻</span>
      <span>{count}</span>
    </button>
  );
}
