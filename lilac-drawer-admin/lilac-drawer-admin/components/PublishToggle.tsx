"use client";

import { useTransition } from "react";
import { togglePublish } from "@/lib/actions";

export default function PublishToggle({ id, isPublished }: { id: number; isPublished: boolean }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => startTransition(() => togglePublish(id, !isPublished))}
      className={`text-xs font-semibold rounded-full px-3 py-1 transition-colors disabled:opacity-50 ${
        isPublished ? "bg-sage/15 text-sage" : "bg-tan/15 text-tan-dark"
      }`}
    >
      {isPending ? "…" : isPublished ? "Published" : "Draft"}
    </button>
  );
}
