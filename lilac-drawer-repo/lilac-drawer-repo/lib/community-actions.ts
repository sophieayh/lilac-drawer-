"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { likes, comments, communityPosts, follows, user } from "@/db/schema";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You must be signed in to do that.");
  return session.user.id;
}

/**
 * Toggle a like on/off for the current user. Runs as a single DB
 * transaction so a like/unlike always lands on exactly the row that
 * matches (this user, this post) — clicking again always reverses the
 * previous action instead of accumulating extra counts.
 */
export async function toggleLike(postId: number): Promise<{ liked: boolean; likeCount: number }> {
  const userId = await requireUserId();

  // If the target post is a bare repost, like the actual canonical post
  let targetPostId = postId;
  let targetRow = await db
    .select({ id: communityPosts.id, repostOfId: communityPosts.repostOfId, body: communityPosts.body })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);

  while (targetRow.length > 0 && targetRow[0].repostOfId && !targetRow[0].body?.trim()) {
    targetPostId = targetRow[0].repostOfId;
    targetRow = await db
      .select({ id: communityPosts.id, repostOfId: communityPosts.repostOfId, body: communityPosts.body })
      .from(communityPosts)
      .where(eq(communityPosts.id, targetPostId))
      .limit(1);
  }

  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.postId, targetPostId), eq(likes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.postId, targetPostId), eq(likes.userId, userId)));
    const [row] = await db
      .update(communityPosts)
      .set({ likeCount: sql`greatest(${communityPosts.likeCount} - 1, 0)` })
      .where(eq(communityPosts.id, targetPostId))
      .returning();
    revalidatePath("/community");
    revalidatePath(`/community/post/${targetPostId}`);
    if (targetPostId !== postId) revalidatePath(`/community/post/${postId}`);
    return { liked: false, likeCount: row?.likeCount ?? 0 };
  }

  await db.insert(likes).values({ postId: targetPostId, userId }).onConflictDoNothing();
  const [row] = await db
    .update(communityPosts)
    .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
    .where(eq(communityPosts.id, targetPostId))
    .returning();
  revalidatePath("/community");
  revalidatePath(`/community/post/${targetPostId}`);
  if (targetPostId !== postId) revalidatePath(`/community/post/${postId}`);
  return { liked: true, likeCount: row?.likeCount ?? 0 };
}

/**
 * Toggle a repost on/off. A repost is just another community_posts row
 * pointing at the original via repostOfId — clicking again finds and
 * removes *this user's* repost of *this specific post* rather than any
 * repost, so it can't remove someone else's repost or double-remove.
 */
export async function toggleRepost(
  postId: number,
  quote: string = "",
): Promise<{ reposted: boolean; repostCount: number }> {
  const userId = await requireUserId();
  const trimmedQuote = quote.trim().slice(0, 500);

  // If the target post is a bare repost, resolve to the underlying original post
  let targetPostId = postId;
  let targetRow = await db
    .select({ id: communityPosts.id, repostOfId: communityPosts.repostOfId, body: communityPosts.body })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);

  while (targetRow.length > 0 && targetRow[0].repostOfId && !targetRow[0].body?.trim()) {
    targetPostId = targetRow[0].repostOfId;
    targetRow = await db
      .select({ id: communityPosts.id, repostOfId: communityPosts.repostOfId, body: communityPosts.body })
      .from(communityPosts)
      .where(eq(communityPosts.id, targetPostId))
      .limit(1);
  }

  const existing = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(and(eq(communityPosts.repostOfId, targetPostId), eq(communityPosts.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(communityPosts).where(eq(communityPosts.id, existing[0].id));
    const [row] = await db
      .update(communityPosts)
      .set({ repostCount: sql`greatest(${communityPosts.repostCount} - 1, 0)` })
      .where(eq(communityPosts.id, targetPostId))
      .returning();
    revalidatePath("/community");
    revalidatePath(`/community/post/${targetPostId}`);
    if (targetPostId !== postId) revalidatePath(`/community/post/${postId}`);
    return { reposted: false, repostCount: row?.repostCount ?? 0 };
  }

  await db.insert(communityPosts).values({ userId, repostOfId: targetPostId, body: trimmedQuote });
  const [row] = await db
    .update(communityPosts)
    .set({ repostCount: sql`${communityPosts.repostCount} + 1` })
    .where(eq(communityPosts.id, targetPostId))
    .returning();
  revalidatePath("/community");
  revalidatePath(`/community/post/${targetPostId}`);
  if (targetPostId !== postId) revalidatePath(`/community/post/${postId}`);
  const [author] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, userId)).limit(1);
  if (author) revalidatePath(`/community/${author.handle}`);
  return { reposted: true, repostCount: row?.repostCount ?? 0 };
}

export async function createComment(
  postId: number,
  body: string,
  parentId?: number | null,
): Promise<{ id: number }> {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment can't be empty.");
  if (trimmed.length > 1000) throw new Error("Comment is too long (max 1000 characters).");

  if (parentId) {
    const [parent] = await db
      .select({ id: comments.id, postId: comments.postId })
      .from(comments)
      .where(eq(comments.id, parentId))
      .limit(1);
    if (!parent || parent.postId !== postId) {
      throw new Error("Parent comment not found for this post.");
    }
  }

  const [row] = await db
    .insert(comments)
    .values({
      postId,
      userId,
      parentId: parentId ?? null,
      body: trimmed,
    })
    .returning();

  await db
    .update(communityPosts)
    .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
    .where(eq(communityPosts.id, postId));

  revalidatePath(`/community/post/${postId}`);
  revalidatePath("/community");
  return { id: row.id };
}

export async function deleteComment(commentId: number): Promise<{ success: boolean }> {
  const userId = await requireUserId();
  const [existing] = await db
    .select({ id: comments.id, postId: comments.postId, userId: comments.userId })
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    throw new Error("You are not authorized to delete this comment.");
  }

  await db.delete(comments).where(eq(comments.id, commentId));
  await db
    .update(communityPosts)
    .set({ commentCount: sql`greatest(${communityPosts.commentCount} - 1, 0)` })
    .where(eq(communityPosts.id, existing.postId));

  revalidatePath(`/community/post/${existing.postId}`);
  revalidatePath("/community");
  return { success: true };
}

export async function createPost(
  body: string,
  productId?: number,
  imageUrl?: string | null,
  imageLabel?: string | null,
  articleId?: number,
): Promise<{ id: number }> {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed && !imageUrl && !articleId) throw new Error("Post can't be empty.");
  if (trimmed.length > 2000) throw new Error("Post is too long (max 2000 characters).");

  const [row] = await db
    .insert(communityPosts)
    .values({
      userId,
      body: trimmed,
      productId: productId ?? null,
      articleId: articleId ?? null,
      hasImage: !!imageUrl,
      imageUrl: imageUrl ?? null,
      imageLabel: imageLabel ?? (imageUrl ? "Attached photo" : null),
    })
    .returning();

  revalidatePath("/community");
  const [author] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, userId)).limit(1);
  if (author) revalidatePath(`/community/${author.handle}`);
  return { id: row.id };
}

export async function shareArticleToCommunity(
  articleId: number,
  opinion: string,
): Promise<{ id: number }> {
  return createPost(opinion, undefined, undefined, undefined, articleId);
}

export async function deletePost(postId: number): Promise<{ success: boolean }> {
  const userId = await requireUserId();

  // Verify ownership
  const [existing] = await db
    .select({ id: communityPosts.id, userId: communityPosts.userId })
    .from(communityPosts)
    .where(eq(communityPosts.id, postId))
    .limit(1);

  if (!existing || existing.userId !== userId) {
    throw new Error("You are not authorized to delete this post.");
  }

  // Delete related likes and comments first
  await db.delete(likes).where(eq(likes.postId, postId));
  await db.delete(comments).where(eq(comments.postId, postId));
  await db.delete(communityPosts).where(eq(communityPosts.id, postId));

  revalidatePath("/community");
  const [author] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, userId)).limit(1);
  if (author) revalidatePath(`/community/${author.handle}`);

  return { success: true };
}

export async function toggleFollow(targetUserId: string): Promise<{ following: boolean }> {
  const userId = await requireUserId();
  if (userId === targetUserId) {
    throw new Error("You cannot follow yourself.");
  }

  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, userId), eq(follows.followingId, targetUserId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
    revalidatePath("/community");
    const [target] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, targetUserId)).limit(1);
    if (target) revalidatePath(`/community/${target.handle}`);
    return { following: false };
  }

  await db.insert(follows).values({ followerId: userId, followingId: targetUserId });
  revalidatePath("/community");
  const [target] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, targetUserId)).limit(1);
  if (target) revalidatePath(`/community/${target.handle}`);
  return { following: true };
}

