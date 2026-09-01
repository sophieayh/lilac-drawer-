"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/community-actions";

export default function PostComposer({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (!body.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await createPost(body);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form id="composer" onSubmit={handleSubmit} className="flex gap-3.5 px-6 py-5 border-b border-border">
      <div className="w-11 h-11 shrink-0 rounded-full bg-mauve-100" aria-hidden="true" />
      <div className="flex-1">
        <label htmlFor="composer-input" className="sr-only">
          What&apos;s inspiring you today?
        </label>
        <textarea
          id="composer-input"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What's inspiring you today?"
          maxLength={2000}
          rows={2}
          className="w-full border-none bg-transparent outline-none text-[17px] py-2.5 resize-none"
        />
        {error && <p className="text-xs text-rose mb-1.5">{error}</p>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isPending || !body.trim()}
            className="bg-lilac text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>
    </form>
  );
}
