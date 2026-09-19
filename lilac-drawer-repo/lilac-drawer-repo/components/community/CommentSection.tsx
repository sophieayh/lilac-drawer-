"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createComment, deleteComment } from "@/lib/community-actions";
import { relativeTime } from "@/lib/format";

export interface CommentItem {
  id: number;
  body: string;
  createdAt: Date | string;
  parentId: number | null;
  userId: string;
  authorName: string;
  authorHandle: string;
  authorImage?: string | null;
}

interface CommentNode extends CommentItem {
  replies: CommentNode[];
}

interface CommentSectionProps {
  postId: number;
  postAuthorHandle?: string;
  comments: CommentItem[];
  currentUserId?: string | null;
  isLoggedIn: boolean;
}

export default function CommentSection({
  postId,
  postAuthorHandle,
  comments,
  currentUserId,
  isLoggedIn,
}: CommentSectionProps) {
  const [rootBody, setRootBody] = useState("");
  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  // Build comment tree (hierarchy) from flat list
  const commentTree = useMemo(() => {
    const map = new Map<number, CommentNode>();
    const roots: CommentNode[] = [];

    // First pass: initialize node with empty replies array
    comments.forEach((c) => {
      map.set(c.id, {
        ...c,
        createdAt: typeof c.createdAt === "string" ? new Date(c.createdAt) : c.createdAt,
        replies: [],
      });
    });

    // Second pass: attach children to parents or place in roots
    comments.forEach((c) => {
      const node = map.get(c.id);
      if (!node) return;

      if (c.parentId && map.has(c.parentId)) {
        map.get(c.parentId)!.replies.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [comments]);

  // Handle Root Comment Submit
  function handleRootSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rootBody.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await createComment(postId, rootBody, null);
        setRootBody("");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment.");
      }
    });
  }

  // Handle Reply Submit
  function handleReplySubmit(e: React.FormEvent, parentId: number) {
    e.preventDefault();
    if (!replyBody.trim() || isPending) return;
    setError(null);

    startTransition(async () => {
      try {
        await createComment(postId, replyBody, parentId);
        setReplyBody("");
        setActiveReplyId(null);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post reply.");
      }
    });
  }

  // Handle Delete Comment
  function handleDelete(commentId: number) {
    if (deletingId || isPending) return;
    if (!window.confirm("Are you sure you want to delete this comment?")) return;

    setDeletingId(commentId);
    startTransition(async () => {
      try {
        await deleteComment(commentId);
        router.refresh();
      } catch (err) {
        alert(err instanceof Error ? err.message : "Failed to delete comment.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  // Recursive Comment Node Component
  function renderCommentNode(node: CommentNode, depth: number = 0) {
    const isReplying = activeReplyId === node.id;
    const isOwner = currentUserId && node.userId === currentUserId;
    const isPostAuthor = postAuthorHandle && node.authorHandle === postAuthorHandle;
    const isDeleting = deletingId === node.id;

    return (
      <div key={node.id} className="relative group/comment">
        {/* Comment Card */}
        <div className="flex gap-3 py-3.5 transition-colors">
          {/* Avatar */}
          <Link href={`/community/${node.authorHandle}`} className="shrink-0">
            {node.authorImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={node.authorImage}
                alt={`${node.authorName} avatar`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border border-lilac/30 shadow-2xs"
              />
            ) : (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-mauve-100 flex items-center justify-center text-purple-deep font-heading font-bold text-xs sm:text-sm shrink-0 border border-lilac/40 shadow-2xs">
                {node.authorName?.charAt(0)?.toUpperCase() || "U"}
              </div>
            )}
          </Link>

          {/* Comment Body & Header */}
          <div className="flex-1 min-w-0">
            {/* Header: Name, Handle, Author Badge, Timestamp */}
            <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5">
              <Link
                href={`/community/${node.authorHandle}`}
                className="font-bold text-xs sm:text-sm text-purple-deep hover:text-rose hover:underline transition-colors"
              >
                {node.authorName}
              </Link>
              <span className="text-tan text-[11px] sm:text-xs">@{node.authorHandle}</span>

              {isPostAuthor && (
                <span className="px-1.5 py-0.5 rounded-md bg-mauve-100 text-purple-deep text-[10px] font-bold uppercase tracking-wider border border-lilac/40">
                  Author
                </span>
              )}

              <span className="text-tan-light text-xs">•</span>
              <span className="text-tan text-[11px] sm:text-xs" suppressHydrationWarning>
                {relativeTime(node.createdAt as Date)} ago
              </span>
            </div>

            {/* Comment Text */}
            <p className="text-[13.5px] sm:text-[14.5px] text-ink leading-relaxed mt-1 whitespace-pre-wrap break-words">
              {node.body}
            </p>

            {/* Comment Actions: Reply / Delete */}
            <div className="flex items-center gap-4 mt-2">
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isReplying) {
                      setActiveReplyId(null);
                      setReplyBody("");
                    } else {
                      setActiveReplyId(node.id);
                      setReplyBody("");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-tan-dark hover:text-purple-deep transition-colors cursor-pointer"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                  <span>{isReplying ? "Cancel" : "Reply"}</span>
                </button>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-tan-dark hover:text-purple-deep transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 10h10a5 5 0 015 5v2m0 0l-4-4m4 4l4-4"
                    />
                  </svg>
                  <span>Reply</span>
                </Link>
              )}

              {isOwner && (
                <button
                  type="button"
                  onClick={() => handleDelete(node.id)}
                  disabled={isDeleting}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-tan hover:text-rose transition-colors cursor-pointer disabled:opacity-50"
                  title="Delete your comment"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
              )}
            </div>

            {/* Inline Reply Form (Shown directly under this comment) */}
            {isReplying && (
              <form
                onSubmit={(e) => handleReplySubmit(e, node.id)}
                className="mt-3 p-3.5 bg-mauve-50/70 rounded-2xl border border-border/80 shadow-xs"
              >
                <div className="flex items-center justify-between text-[11px] text-tan-dark font-medium mb-1.5">
                  <span>
                    Replying to <strong className="text-purple-deep">@{node.authorHandle}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveReplyId(null);
                      setReplyBody("");
                    }}
                    className="text-tan hover:text-purple-deep transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                <textarea
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  placeholder="Write your reply..."
                  maxLength={1000}
                  rows={2}
                  autoFocus
                  className="w-full bg-white border border-border rounded-xl p-2.5 text-xs sm:text-sm text-purple-deep placeholder:text-tan outline-none focus:border-rose resize-none"
                />
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-tan">{replyBody.length} / 1000</span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(null);
                        setReplyBody("");
                      }}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold text-tan-dark hover:bg-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || !replyBody.trim()}
                      className="bg-purple-deep hover:bg-purple-deep/90 text-white rounded-full px-4 py-1.5 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      {isPending ? "Posting…" : "Reply"}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Nested Replies (Thread Tree) */}
        {node.replies.length > 0 && (
          <div className="border-l-2 border-lilac/30 ml-4 sm:ml-5 pl-3 sm:pl-5 space-y-1">
            {node.replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* 1. Main Root Comment Form */}
      {isLoggedIn ? (
        <form
          onSubmit={handleRootSubmit}
          className="bg-white rounded-2xl p-4 sm:p-5 border border-border shadow-xs mb-8"
        >
          <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-purple-deep">
            <svg
              className="w-4 h-4 text-rose"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <span>Leave a Comment</span>
          </div>
          <textarea
            id={`comment-root-${postId}`}
            value={rootBody}
            onChange={(e) => setRootBody(e.target.value)}
            placeholder="Share your thoughts, opinions, or ask a question..."
            maxLength={1000}
            rows={3}
            className="w-full bg-mauve-50/40 border border-border rounded-xl p-3 text-sm text-purple-deep placeholder:text-tan outline-none focus:border-rose resize-none transition-colors"
          />
          {error && <p className="text-xs text-rose mt-1.5 font-medium">{error}</p>}
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[11px] text-tan">{rootBody.length} / 1000</span>
            <button
              type="submit"
              disabled={isPending || !rootBody.trim()}
              className="bg-purple-deep hover:bg-purple-deep/90 text-white rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              {isPending ? "Posting…" : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="bg-white rounded-2xl p-5 border border-border shadow-xs mb-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <h4 className="font-heading text-sm font-bold text-purple-deep">Join the Discussion</h4>
            <p className="text-xs text-tan-dark mt-0.5">
              Sign in to share your thoughts, comment, and reply to others.
            </p>
          </div>
          <Link
            href="/login"
            className="bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-xs shrink-0"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* 2. Comments Count & Thread List */}
      <section id="comments" className="scroll-mt-6">
        <div className="flex items-center justify-between pb-3 border-b border-border mb-2">
          <h2 className="font-heading text-base sm:text-lg font-bold text-purple-deep flex items-center gap-2">
            <span>Comments & Replies</span>
            <span className="px-2 py-0.5 rounded-full bg-mauve-100 text-purple-deep text-xs font-bold">
              {comments.length}
            </span>
          </h2>
        </div>

        {/* Comment Tree */}
        <div className="divide-y divide-border/60">
          {commentTree.map((rootNode) => renderCommentNode(rootNode, 0))}
        </div>

        {/* Empty State */}
        {comments.length === 0 && (
          <div className="text-center py-12 px-4 rounded-2xl bg-white/60 border border-dashed border-border my-4">
            <div className="w-10 h-10 rounded-full bg-mauve-50 flex items-center justify-center mx-auto mb-2.5 text-purple-deep">
              <svg
                className="w-5 h-5 text-rose"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-heading text-sm font-bold text-purple-deep mb-1">No comments yet</p>
            <p className="text-xs text-tan-dark">Be the first to start the conversation on this post!</p>
          </div>
        )}
      </section>
    </div>
  );
}
