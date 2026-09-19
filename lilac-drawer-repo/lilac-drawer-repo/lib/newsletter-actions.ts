"use server";

import { headers } from "next/headers";
import { eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { newsletterSubscribers } from "@/db/schema";

/**
 * Subscribes an email address to the newsletter/deals list.
 * Can be called by authenticated users or guest visitors.
 */
export async function subscribeNewsletter(
  rawEmail: string,
  explicitUserId?: string | null,
): Promise<{ success: boolean; message: string; isSubscribed: boolean }> {
  const email = (rawEmail || "").trim().toLowerCase();

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    throw new Error("Please enter a valid email address.");
  }

  // Attempt to resolve userId from session if not explicitly provided
  let resolvedUserId = explicitUserId || null;
  if (!resolvedUserId) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user?.id) {
        resolvedUserId = session.user.id;
      }
    } catch {
      // Guest subscription without active session
    }
  }

  // Check if already subscribed
  const existing = await db
    .select({ id: newsletterSubscribers.id, userId: newsletterSubscribers.userId })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);

  if (existing.length > 0) {
    // If found and now has a userId to associate, update it
    if (resolvedUserId && !existing[0].userId) {
      await db
        .update(newsletterSubscribers)
        .set({ userId: resolvedUserId })
        .where(eq(newsletterSubscribers.id, existing[0].id));
    }
    return {
      success: true,
      message: "You are already subscribed to our newsletter!",
      isSubscribed: true,
    };
  }

  // Insert new subscription
  await db
    .insert(newsletterSubscribers)
    .values({
      email,
      userId: resolvedUserId,
    })
    .onConflictDoNothing();

  return {
    success: true,
    message: "Welcome to the Lilac Club! You're now subscribed.",
    isSubscribed: true,
  };
}

/**
 * Checks if the given email or currently logged-in user is subscribed.
 */
export async function checkIsSubscribed(
  emailToCheck?: string | null,
  userIdToCheck?: string | null,
): Promise<{ isSubscribed: boolean }> {
  try {
    let resolvedEmail = emailToCheck?.trim().toLowerCase() || null;
    let resolvedUserId = userIdToCheck || null;

    if (!resolvedEmail && !resolvedUserId) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (session?.user) {
        resolvedEmail = session.user.email?.toLowerCase() || null;
        resolvedUserId = session.user.id || null;
      }
    }

    if (!resolvedEmail && !resolvedUserId) {
      return { isSubscribed: false };
    }

    const conditions = [];
    if (resolvedEmail) conditions.push(eq(newsletterSubscribers.email, resolvedEmail));
    if (resolvedUserId) conditions.push(eq(newsletterSubscribers.userId, resolvedUserId));

    const rows = await db
      .select({ id: newsletterSubscribers.id })
      .from(newsletterSubscribers)
      .where(or(...conditions))
      .limit(1);

    return { isSubscribed: rows.length > 0 };
  } catch {
    return { isSubscribed: false };
  }
}
