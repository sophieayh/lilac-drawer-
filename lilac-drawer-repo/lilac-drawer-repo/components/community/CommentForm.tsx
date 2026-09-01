"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createComment } from "@/lib/community-actions";

export default function CommentForm({ postId, isLoggedIn }: { postId: number; isLoggedIn: boolean }) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (!isLoggedIn) {
    return (
      <a href="/login" className="block text-sm text-rose font-semibold py-3.5 border-b border-border">
        Sign in to comment
      </a>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() || isPending) return;
    setError(null);
    startTransition(async () => {
      try {
        await createComment(postId, body);
        setBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="py-4 border-b border-border">
      <label htmlFor={`comment-${postId}`} className="sr-only">
        Add a comment
      </label>
      <textarea
        id={`comment-${postId}`}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add a comment..."
        maxLength={1000}
        rows={2}
        className="w-full border border-border rounded-xl p-3 text-sm outline-none resize-none"
      />
      {error && <p className="text-xs text-rose mt-1.5">{error}</p>}
      <div className="flex justify-end mt-2">
        <button
          type="submit"
          disabled={isPending || !body.trim()}
          className="bg-lilac text-white rounded-full px-5 py-2 text-sm font-semibold disabled:opacity-50"
        >
          {isPending ? "Posting…" : "Comment"}
        </button>
      </div>
    </form>
  );
}
