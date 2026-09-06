"use client";

import { useTransition } from "react";
import { toggleBannerActive } from "@/lib/actions";

export default function BannerActiveToggle({ id, isActive }: { id: number; isActive: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => toggleBannerActive(id, !isActive))}
      className={`text-xs font-semibold rounded-full px-3 py-1 transition-colors disabled:opacity-50 cursor-pointer ${
        isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200" : "bg-tan/15 text-tan-dark hover:bg-tan/25"
      }`}
    >
      {isPending ? "…" : isActive ? "Active" : "Inactive"}
    </button>
  );
}
