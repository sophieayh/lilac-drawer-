"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollow } from "@/lib/community-actions";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  isLoggedIn?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export default function FollowButton({
  targetUserId,
  initialIsFollowing = false,
  isLoggedIn = false,
  className = "",
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isHovered, setIsHovered] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleFollowClick = () => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    // Optimistic toggle
    const nextState = !isFollowing;
    setIsFollowing(nextState);

    startTransition(async () => {
      try {
        const res = await toggleFollow(targetUserId);
        setIsFollowing(res.following);
        router.refresh();
      } catch (err) {
        setIsFollowing(!nextState); // rollback
        console.error("Follow error:", err);
      }
    });
  };

  const isSmall = size === "sm";

  return (
    <button
      type="button"
      onClick={handleFollowClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isPending}
      className={`inline-flex items-center justify-center gap-1.5 font-bold rounded-full transition-all cursor-pointer select-none shadow-xs disabled:opacity-60 ${
        isSmall ? "px-3.5 py-1.5 text-xs" : "px-5 py-2 text-xs md:text-sm"
      } ${
        isFollowing
          ? isHovered
            ? "bg-rose-50 text-rose border border-rose/40 hover:bg-rose hover:text-white"
            : "bg-mauve-50 text-purple-deep border border-border hover:border-purple-deep"
          : "bg-purple-deep hover:bg-purple-deep/90 text-white"
      } ${className}`}
    >
      {isFollowing ? (
        <>
          {isHovered ? (
            <span>Unfollow</span>
          ) : (
            <>
              <svg
                className="w-3.5 h-3.5 text-purple-deep"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span>Following</span>
            </>
          )}
        </>
      ) : (
        <>
          <svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
