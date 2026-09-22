"use client";

import { useState, useTransition, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createComment, deleteComment, toggleCommentReaction } from "@/lib/community-actions";
import { relativeTime } from "@/lib/format";
import ImageLightboxModal from "@/components/ImageLightboxModal";
import { compressImage } from "@/lib/image-utils";
import { checkExternalLinks } from "@/lib/link-moderation";
import CommunityText from "@/components/community/CommunityText";

export interface CommentItem {
  id: number;
  body: string;
  imageUrl?: string | null;
  likeCount?: number;
  dislikeCount?: number;
  userReaction?: "like" | "dislike" | null;
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
  const [rootImagePreview, setRootImagePreview] = useState<string | null>(null);
  const [rootImageName, setRootImageName] = useState<string | null>(null);
  const rootFileInputRef = useRef<HTMLInputElement>(null);

  const [activeReplyId, setActiveReplyId] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const [replyImagePreview, setReplyImagePreview] = useState<string | null>(null);
  const [replyImageName, setReplyImageName] = useState<string | null>(null);
  const replyFileInputRef = useRef<HTMLInputElement>(null);

  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "most_liked">("newest");
  const [reactions, setReactions] = useState<
    Record<number, { userReaction: "like" | "dislike" | null; likeCount: number; dislikeCount: number }>
  >({});
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const router = useRouter();

  function getReaction(node: CommentNode) {
    return (
      reactions[node.id] ?? {
        userReaction: node.userReaction ?? null,
        likeCount: node.likeCount ?? 0,
        dislikeCount: node.dislikeCount ?? 0,
      }
    );
  }

  // Build comment tree (hierarchy) from flat list and sort roots
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

    // Sort roots based on selected sortMode
    if (sortBy === "newest") {
      roots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === "oldest") {
      roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (sortBy === "most_liked") {
      roots.sort((a, b) => {
        const aLike = reactions[a.id]?.likeCount ?? a.likeCount ?? 0;
        const bLike = reactions[b.id]?.likeCount ?? b.likeCount ?? 0;
        return bLike - aLike;
      });
    }

    return roots;
  }, [comments, sortBy, reactions]);

  function handleFileSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    onPreview: (url: string, name: string) => void,
    onError: (msg: string) => void,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      onError("Please select a valid image file (PNG, JPG, WebP, etc.).");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      onError("Image size is too large (max 15MB).");
      return;
    }

    compressImage(file, 1200, 0.82)
      .then((compressedUrl) => {
        onPreview(compressedUrl, file.name);
      })
      .catch(() => {
        onError("Failed to process image.");
      });
  }

  // Handle Root Comment Submit
  function handleRootSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!rootBody.trim() && !rootImagePreview) || isPending) return;

    if (rootBody.trim()) {
      const linkCheck = checkExternalLinks(rootBody);
      if (linkCheck.hasExternalLink) {
        setError(linkCheck.errorMessage || "External links are not allowed in comments.");
        return;
      }
    }

    setError(null);

    startTransition(async () => {
      try {
        let uploadedUrl: string | null = null;
        if (rootImagePreview) {
          const res = await fetch("/api/community/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl: rootImagePreview,
              filename: rootImageName || "comment-image.jpg",
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload image");
          uploadedUrl = data.url;
        }

        await createComment(postId, rootBody, null, uploadedUrl);
        setRootBody("");
        setRootImagePreview(null);
        setRootImageName(null);
        if (rootFileInputRef.current) rootFileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to post comment.");
      }
    });
  }

  // Handle Reply Submit
  function handleReplySubmit(e: React.FormEvent, parentId: number) {
    e.preventDefault();
    if ((!replyBody.trim() && !replyImagePreview) || isPending) return;

    if (replyBody.trim()) {
      const linkCheck = checkExternalLinks(replyBody);
      if (linkCheck.hasExternalLink) {
        setReplyError(linkCheck.errorMessage || "External links are not allowed in replies.");
        return;
      }
    }

    setReplyError(null);

    startTransition(async () => {
      try {
        let uploadedUrl: string | null = null;
        if (replyImagePreview) {
          const res = await fetch("/api/community/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              dataUrl: replyImagePreview,
              filename: replyImageName || "reply-image.jpg",
            }),
          });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || "Failed to upload image");
          uploadedUrl = data.url;
        }

        await createComment(postId, replyBody, parentId, uploadedUrl);
        setReplyBody("");
        setReplyImagePreview(null);
        setReplyImageName(null);
        setActiveReplyId(null);
        if (replyFileInputRef.current) replyFileInputRef.current.value = "";
        router.refresh();
      } catch (err) {
        setReplyError(err instanceof Error ? err.message : "Failed to post reply.");
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

  // Handle Like / Dislike reaction
  async function handleReaction(node: CommentNode, type: "like" | "dislike") {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/community/post/${postId}`);
      return;
    }

    const current = getReaction(node);
    let nextReaction: "like" | "dislike" | null = null;
    let nextLike = current.likeCount;
    let nextDislike = current.dislikeCount;

    if (current.userReaction === type) {
      nextReaction = null;
      if (type === "like") nextLike = Math.max(0, nextLike - 1);
      else nextDislike = Math.max(0, nextDislike - 1);
    } else {
      nextReaction = type;
      if (type === "like") {
        nextLike += 1;
        if (current.userReaction === "dislike") nextDislike = Math.max(0, nextDislike - 1);
      } else {
        nextDislike += 1;
        if (current.userReaction === "like") nextLike = Math.max(0, nextLike - 1);
      }
    }

    setReactions((prev) => ({
      ...prev,
      [node.id]: { userReaction: nextReaction, likeCount: nextLike, dislikeCount: nextDislike },
    }));

    try {
      const res = await toggleCommentReaction(node.id, type);
      setReactions((prev) => ({
        ...prev,
        [node.id]: res,
      }));
    } catch {
      // Revert optimistic update
      setReactions((prev) => ({
        ...prev,
        [node.id]: current,
      }));
    }
  }

  // Recursive Comment Node Component
  function renderCommentNode(node: CommentNode, depth: number = 0) {
    const isReplying = activeReplyId === node.id;
    const isOwner = currentUserId && node.userId === currentUserId;
    const isPostAuthor = postAuthorHandle && node.authorHandle === postAuthorHandle;
    const isDeleting = deletingId === node.id;
    const reaction = getReaction(node);

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
            {node.body && (
              <CommunityText
                text={node.body}
                className="text-[13.5px] sm:text-[14.5px] text-ink leading-relaxed mt-1 whitespace-pre-wrap break-words"
              />
            )}

            {/* Comment Attached Image */}
            {node.imageUrl && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => setLightboxImage(node.imageUrl || null)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setLightboxImage(node.imageUrl || null);
                  }
                }}
                className="mt-2 max-w-[280px] sm:max-w-[340px] rounded-xl overflow-hidden border border-border/80 bg-mauve-50/50 cursor-pointer group/cmtimg relative"
                title="Click to view full screen"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={node.imageUrl}
                  alt="Attached comment image"
                  className="w-full h-auto max-h-[220px] object-cover group-hover/cmtimg:scale-102 group-hover/cmtimg:brightness-95 transition-all duration-200"
                />
                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-xs text-white p-1 rounded-md opacity-0 group-hover/cmtimg:opacity-100 transition-opacity">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                </div>
              </div>
            )}

            {/* Comment Actions: Like / Dislike / Reply / Delete */}
            <div className="flex items-center gap-3 sm:gap-4 mt-2">
              {/* Like Button */}
              <button
                type="button"
                onClick={() => handleReaction(node, "like")}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer select-none ${
                  reaction.userReaction === "like"
                    ? "text-rose bg-rose/10 font-bold"
                    : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
                }`}
                title="Like comment"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={reaction.userReaction === "like" ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                  />
                </svg>
                <span>{reaction.likeCount > 0 ? reaction.likeCount : ""}</span>
              </button>

              {/* Dislike Button */}
              <button
                type="button"
                onClick={() => handleReaction(node, "dislike")}
                className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full transition-colors cursor-pointer select-none ${
                  reaction.userReaction === "dislike"
                    ? "text-purple-deep bg-mauve-100 font-bold"
                    : "text-tan-dark hover:text-purple-deep hover:bg-mauve-50"
                }`}
                title="Dislike comment"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill={reaction.userReaction === "dislike" ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v5a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5"
                  />
                </svg>
                <span>{reaction.dislikeCount > 0 ? reaction.dislikeCount : ""}</span>
              </button>

              {/* Reply Button */}
              {isLoggedIn ? (
                <button
                  type="button"
                  onClick={() => {
                    if (isReplying) {
                      setActiveReplyId(null);
                      setReplyBody("");
                      setReplyImagePreview(null);
                      setReplyImageName(null);
                    } else {
                      setActiveReplyId(node.id);
                      setReplyBody("");
                      setReplyImagePreview(null);
                      setReplyImageName(null);
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
                  href={`/login?redirect=/community/post/${postId}`}
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

            {/* Inline Reply Form */}
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
                      setReplyImagePreview(null);
                      setReplyImageName(null);
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

                {/* Reply Attached Image Preview */}
                {replyImagePreview && (
                  <div className="relative mt-2 inline-block">
                    <div className="rounded-xl overflow-hidden border border-border max-w-[160px] max-h-[120px] bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={replyImagePreview}
                        alt="Reply preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyImagePreview(null);
                        setReplyImageName(null);
                        if (replyFileInputRef.current) replyFileInputRef.current.value = "";
                      }}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-white flex items-center justify-center text-xs shadow-xs cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                )}

                {replyError && <p className="text-xs text-rose mt-1">{replyError}</p>}

                <div className="flex items-center justify-between mt-2.5">
                  {/* Attach Photo to Reply */}
                  <div>
                    <input
                      type="file"
                      ref={replyFileInputRef}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                      onChange={(e) =>
                        handleFileSelect(
                          e,
                          (url, name) => {
                            setReplyImagePreview(url);
                            setReplyImageName(name);
                            setReplyError(null);
                          },
                          (msg) => setReplyError(msg),
                        )
                      }
                      className="hidden"
                      id={`reply-image-upload-${node.id}`}
                    />
                    <button
                      type="button"
                      onClick={() => replyFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-deep hover:text-rose transition-colors cursor-pointer"
                      title="Attach Photo"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      <span>Photo</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-tan">{replyBody.length} / 1000</span>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReplyId(null);
                        setReplyBody("");
                        setReplyImagePreview(null);
                        setReplyImageName(null);
                      }}
                      className="px-3 py-1 rounded-full text-xs font-semibold text-tan-dark hover:bg-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || (!replyBody.trim() && !replyImagePreview)}
                      className="bg-purple-deep hover:bg-purple-deep/90 text-white rounded-full px-4 py-1 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
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

          {/* Root Comment Attached Image Preview */}
          {rootImagePreview && (
            <div className="relative mt-2.5 mb-1 inline-block">
              <div className="rounded-xl overflow-hidden border border-border max-w-[200px] max-h-[140px] bg-mauve-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={rootImagePreview}
                  alt="Comment upload preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setRootImagePreview(null);
                  setRootImageName(null);
                  if (rootFileInputRef.current) rootFileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-ink/80 hover:bg-ink text-white flex items-center justify-center text-xs shadow-md transition-colors cursor-pointer"
                title="Remove photo"
              >
                ×
              </button>
            </div>
          )}

          {error && <p className="text-xs text-rose mt-1.5 font-medium">{error}</p>}

          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40">
            {/* Attach Image Button */}
            <div>
              <input
                type="file"
                ref={rootFileInputRef}
                accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
                onChange={(e) =>
                  handleFileSelect(
                    e,
                    (url, name) => {
                      setRootImagePreview(url);
                      setRootImageName(name);
                      setError(null);
                    },
                    (msg) => setError(msg),
                  )
                }
                className="hidden"
                id={`root-image-upload-${postId}`}
              />
              <button
                type="button"
                onClick={() => rootFileInputRef.current?.click()}
                className="group inline-flex items-center gap-1.5 text-purple-deep hover:text-rose text-xs sm:text-sm font-semibold py-1 transition-colors duration-200 cursor-pointer select-none"
                title="Attach photo to comment"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform duration-200 group-hover:scale-120"
                >
                  <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                  <circle cx="9" cy="9" r="2" />
                  <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                </svg>
                <span>{rootImagePreview ? "Change Photo" : "Photo"}</span>
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-tan">{rootBody.length} / 1000</span>
              <button
                type="submit"
                disabled={isPending || (!rootBody.trim() && !rootImagePreview)}
                className="bg-purple-deep hover:bg-purple-deep/90 text-white rounded-full px-5 py-2 text-xs sm:text-sm font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isPending ? "Posting…" : "Post Comment"}
              </button>
            </div>
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
            href={`/login?redirect=/community/post/${postId}`}
            className="bg-purple-deep hover:bg-purple-deep/90 text-white text-xs font-bold px-5 py-2.5 rounded-full transition-all shadow-xs shrink-0"
          >
            Sign In to Comment
          </Link>
        </div>
      )}

      {/* 2. Comments Count & Thread List */}
      <section id="comments" className="scroll-mt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-3 border-b border-border mb-2">
          <h2 className="font-heading text-base sm:text-lg font-bold text-purple-deep flex items-center gap-2">
            <span>Comments & Replies</span>
            <span className="px-2 py-0.5 rounded-full bg-mauve-100 text-purple-deep text-xs font-bold">
              {comments.length}
            </span>
          </h2>

          {/* Sorting Controls */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-tan-dark font-medium mr-0.5">Sort:</span>
            <div className="inline-flex items-center bg-mauve-50/90 p-0.5 rounded-xl border border-border/70 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSortBy("newest")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === "newest"
                    ? "bg-white text-purple-deep shadow-2xs font-bold"
                    : "text-tan hover:text-purple-deep"
                }`}
                title="Sort by Newest"
              >
                Newest
              </button>
              <button
                type="button"
                onClick={() => setSortBy("oldest")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === "oldest"
                    ? "bg-white text-purple-deep shadow-2xs font-bold"
                    : "text-tan hover:text-purple-deep"
                }`}
                title="Sort by Oldest"
              >
                Oldest
              </button>
              <button
                type="button"
                onClick={() => setSortBy("most_liked")}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  sortBy === "most_liked"
                    ? "bg-white text-purple-deep shadow-2xs font-bold"
                    : "text-tan hover:text-purple-deep"
                }`}
                title="Sort by Most Liked"
              >
                Most Liked
              </button>
            </div>
          </div>
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

      {/* Lightbox Modal for Comment Images */}
      {lightboxImage && (
        <ImageLightboxModal
          isOpen={!!lightboxImage}
          imageUrl={lightboxImage}
          title="Attached Image"
          onClose={() => setLightboxImage(null)}
        />
      )}
    </div>
  );
}
