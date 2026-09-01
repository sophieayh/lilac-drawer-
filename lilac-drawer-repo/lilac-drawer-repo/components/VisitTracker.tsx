"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const payload = JSON.stringify({ path: pathname });
    // sendBeacon survives the page unloading mid-navigation and doesn't
    // block rendering; fall back to fetch for browsers/environments where
    // it's unavailable.
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      navigator.sendBeacon("/api/track-visit", blob);
    } else {
      fetch("/api/track-visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
