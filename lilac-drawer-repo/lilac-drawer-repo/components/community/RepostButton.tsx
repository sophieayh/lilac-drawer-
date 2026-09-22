"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toggleRepost } from "@/lib/community-actions";
import { checkExternalLinks } from "@/lib/link-moderation";

interface RepostButtonProps {
  postId: number;
  initialReposted: boolean;
  initialCount: number;
  isLoggedIn: boolean;
  postAuthorName?: string | null;
  postAuthorHandle?: string | null;
  postAuthorImage?: string | null;
  postBody?: string | null;
  postImageUrl?: string | null;
}

export default function RepostButton({
  postId,
  initialReposted,
  initialCount,
  isLoggedIn,
  postAuthorName,
  postAuthorHandle,
  postAuthorImage,
  postBody,
  postImageUrl,
}: RepostButtonProps) {
  const [reposted, setReposted] = useState(initialReposted);
  const [count, setCount] = useState(initialCount);
  const [animating, setAnimating] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [quoteModalOpen, setQuoteModalOpen] = useState(false);
  const [opinion, setOpinion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  // Main button click handler
  function handleButtonClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!isLoggedIn) {
      router.push("/login?redirect=/community");
      return;
    }

    if (isPending) return;

    if (reposted) {
      // Direct Undo Repost
      performRepostToggle("");
    } else {
      // Toggle dropdown menu for choice: Instant Repost vs Quote Repost
      setMenuOpen((prev) => !prev);
    }
  }

  // Instant Repost (no quote)
  function handleInstantRepost(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    performRepostToggle("");
  }

  // Open Quote Modal
  function handleOpenQuoteModal(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    setOpinion("");
    setError(null);
    setQuoteModalOpen(true);
  }

  // Submit Quote Repost
  function handleQuoteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isPending) return;
    const trimmed = opinion.trim();
    if (trimmed) {
      const linkCheck = checkExternalLinks(trimmed);
      if (linkCheck.hasExternalLink) {
        setError(linkCheck.errorMessage || "External links are not allowed in quote reposts.");
        return;
      }
    }
    performRepostToggle(trimmed);
  }

  function performRepostToggle(quoteText: string) {
    const nextReposted = !reposted;
    setReposted(nextReposted);
    setCount((c) => (nextReposted ? c + 1 : Math.max(0, c - 1)));

    if (nextReposted) {
      setAnimating(true);
      setTimeout(() => setAnimating(false), 500);
    }

    startTransition(async () => {
      try {
        const result = await toggleRepost(postId, quoteText);
        setReposted(result.reposted);
        setCount(result.repostCount);
        setQuoteModalOpen(false);
        router.refresh();
      } catch (err) {
        setReposted(!nextReposted);
        setCount((c) => (nextReposted ? Math.max(0, c - 1) : c + 1));
        setError(err instanceof Error ? err.message : "Failed to repost");
      }
    });
  }

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* 1. Main Action Button */}
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isPending}
        aria-pressed={reposted}
        title={reposted ? "Undo repost" : "Repost or Quote with Opinion"}
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

      {/* 2. Repost Options Menu Popover */}
      {menuOpen && (
        <div
          className="absolute bottom-full left-0 mb-2 w-52 bg-white rounded-2xl shadow-xl border border-border py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Option A: Quick Repost */}
          <button
            type="button"
            onClick={handleInstantRepost}
            className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-mauve-50 text-left text-xs font-bold text-purple-deep transition-colors cursor-pointer"
          >
            <svg
              className="w-4 h-4 text-emerald-600 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v-2a4 4 0 0 1 4-4h12M16 2l4 4-4 4M20 12v2a4 4 0 0 1-4 4H4M8 22l-4-4 4-4" />
            </svg>
            <div>
              <div>Repost</div>
              <div className="text-[10.5px] text-tan font-normal">Share instantly to feed</div>
            </div>
          </button>

          {/* Option B: Quote / Add Opinion */}
          <button
            type="button"
            onClick={handleOpenQuoteModal}
            className="w-full px-3.5 py-2.5 flex items-center gap-2.5 hover:bg-mauve-50 text-left text-xs font-bold text-purple-deep transition-colors cursor-pointer border-t border-border/50"
          >
            <svg
              className="w-4 h-4 text-rose shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <div>
              <div>Quote Post</div>
              <div className="text-[10.5px] text-tan font-normal">Add your opinion & thoughts</div>
            </div>
          </button>
        </div>
      )}

      {/* 3. Quote Post Modal (Express Opinion with Repost) */}
      {quoteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={() => setQuoteModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl border border-border shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-mauve-50/40">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v-2a4 4 0 0 1 4-4h12M16 2l4 4-4 4M20 12v2a4 4 0 0 1-4 4H4M8 22l-4-4 4-4" />
                </svg>
                <h3 className="font-heading text-base font-bold text-purple-deep">
                  Quote Repost · Add Opinion
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setQuoteModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-mauve-100 flex items-center justify-center text-tan hover:text-purple-deep transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body & Form */}
            <form onSubmit={handleQuoteSubmit} className="p-5 flex-1 overflow-y-auto space-y-4">
              {/* User Opinion Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-deep mb-1.5">
                  Your Thoughts & Opinion
                </label>
                <textarea
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                  placeholder="Share your review, perspective, or thoughts on this post..."
                  maxLength={500}
                  rows={3}
                  autoFocus
                  className="w-full bg-mauve-50/40 border border-border rounded-2xl p-3.5 text-sm text-purple-deep placeholder:text-tan outline-none focus:border-rose resize-none transition-colors"
                />
                <div className="flex justify-between items-center text-[11px] text-tan mt-1">
                  <span>Express your opinion clearly</span>
                  <span>{opinion.length} / 500</span>
                </div>
              </div>

              {/* Embedded Original Post Preview */}
              <div className="rounded-2xl border border-border bg-mauve-50/60 p-3.5 shadow-2xs">
                <div className="flex items-center gap-2 mb-2">
                  {postAuthorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={postAuthorImage}
                      alt={postAuthorName || "Author"}
                      className="w-6 h-6 rounded-full object-cover border border-lilac/30"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-bold text-[10px]">
                      {postAuthorName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                  )}
                  <span className="text-xs font-bold text-purple-deep">{postAuthorName || "Community Member"}</span>
                  {postAuthorHandle && (
                    <span className="text-[11px] text-tan">@{postAuthorHandle}</span>
                  )}
                </div>

                {postBody && (
                  <p className="text-xs text-ink line-clamp-3 leading-relaxed mb-2">
                    {postBody}
                  </p>
                )}

                {postImageUrl && (
                  <div className="rounded-xl overflow-hidden max-h-32 bg-white border border-border/70 mt-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={postImageUrl}
                      alt="Original post preview"
                      className="w-full h-full object-cover max-h-32"
                    />
                  </div>
                )}
              </div>

              {error && <p className="text-xs text-rose font-medium">{error}</p>}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setQuoteModalOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-tan-dark hover:bg-mauve-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-5 py-2 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v-2a4 4 0 0 1 4-4h12M16 2l4 4-4 4M20 12v2a4 4 0 0 1-4 4H4M8 22l-4-4 4-4" />
                  </svg>
                  <span>{isPending ? "Reposting…" : "Repost with Opinion"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
