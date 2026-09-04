"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { likes, comments, communityPosts, user } from "@/db/schema";

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

  const existing = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(likes).where(and(eq(likes.postId, postId), eq(likes.userId, userId)));
    const [row] = await db
      .update(communityPosts)
      .set({ likeCount: sql`greatest(${communityPosts.likeCount} - 1, 0)` })
      .where(eq(communityPosts.id, postId))
      .returning();
    revalidatePath("/community");
    revalidatePath(`/community/post/${postId}`);
    return { liked: false, likeCount: row?.likeCount ?? 0 };
  }

  await db.insert(likes).values({ postId, userId }).onConflictDoNothing();
  const [row] = await db
    .update(communityPosts)
    .set({ likeCount: sql`${communityPosts.likeCount} + 1` })
    .where(eq(communityPosts.id, postId))
    .returning();
  revalidatePath("/community");
  revalidatePath(`/community/post/${postId}`);
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

  const existing = await db
    .select({ id: communityPosts.id })
    .from(communityPosts)
    .where(and(eq(communityPosts.repostOfId, postId), eq(communityPosts.userId, userId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(communityPosts).where(eq(communityPosts.id, existing[0].id));
    const [row] = await db
      .update(communityPosts)
      .set({ repostCount: sql`greatest(${communityPosts.repostCount} - 1, 0)` })
      .where(eq(communityPosts.id, postId))
      .returning();
    revalidatePath("/community");
    revalidatePath(`/community/post/${postId}`);
    return { reposted: false, repostCount: row?.repostCount ?? 0 };
  }

  await db.insert(communityPosts).values({ userId, repostOfId: postId, body: trimmedQuote });
  const [row] = await db
    .update(communityPosts)
    .set({ repostCount: sql`${communityPosts.repostCount} + 1` })
    .where(eq(communityPosts.id, postId))
    .returning();
  revalidatePath("/community");
  revalidatePath(`/community/post/${postId}`);
  const [author] = await db.select({ handle: user.handle }).from(user).where(eq(user.id, userId)).limit(1);
  if (author) revalidatePath(`/community/${author.handle}`);
  return { reposted: true, repostCount: row?.repostCount ?? 0 };
}

export async function createComment(postId: number, body: string): Promise<void> {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Comment can't be empty.");
  if (trimmed.length > 1000) throw new Error("Comment is too long (max 1000 characters).");

  await db.insert(comments).values({ postId, userId, body: trimmed });
  await db
    .update(communityPosts)
    .set({ commentCount: sql`${communityPosts.commentCount} + 1` })
    .where(eq(communityPosts.id, postId));

  revalidatePath(`/community/post/${postId}`);
}

export async function createPost(
  body: string,
  productId?: number,
  imageUrl?: string | null,
  imageLabel?: string | null,
): Promise<{ id: number }> {
  const userId = await requireUserId();
  const trimmed = body.trim();
  if (!trimmed && !imageUrl) throw new Error("Post can't be empty.");
  if (trimmed.length > 2000) throw new Error("Post is too long (max 2000 characters).");

  const [row] = await db
    .insert(communityPosts)
    .values({
      userId,
      body: trimmed,
      productId: productId ?? null,
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
