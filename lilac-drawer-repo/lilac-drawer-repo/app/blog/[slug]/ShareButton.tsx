"use client";

import { useState } from "react";

export default function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled the share sheet — fall through to nothing further
        return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable — nothing more we can do silently
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="shrink-0 border border-purple-deep/30 text-purple-deep text-xs font-semibold rounded-full px-4 py-1.5 hover:bg-purple-deep hover:text-white transition-colors"
    >
      {copied ? "Link copied" : "Share"}
    </button>
  );
}
