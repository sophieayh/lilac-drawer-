"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { notifications, user, type NotificationType } from "@/db/schema";
import {
  getNotificationsForUser,
  getUnreadNotificationCount,
  type NotificationItem,
} from "@/db/queries";
import { sendPushToUser, sendPushToAll } from "@/lib/push-notifications";

async function requireUserId(): Promise<string> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new Error("You must be signed in to do that.");
  return session.user.id;
}

export async function fetchUserNotifications(options?: {
  limit?: number;
  offset?: number;
  unreadOnly?: boolean;
  typeFilter?: string;
}): Promise<NotificationItem[]> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return [];
  return getNotificationsForUser(session.user.id, options);
}

export async function fetchUnreadCount(): Promise<number> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return 0;
  return getUnreadNotificationCount(session.user.id);
}

export async function markAsReadAction(notificationId: number): Promise<{ success: boolean }> {
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  revalidatePath("/notifications");
  return { success: true };
}

export async function markAllAsReadAction(): Promise<{ success: boolean }> {
  const userId = await requireUserId();
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
  revalidatePath("/notifications");
  return { success: true };
}

export async function deleteNotificationAction(notificationId: number): Promise<{ success: boolean }> {
  const userId = await requireUserId();
  await db
    .delete(notifications)
    .where(and(eq(notifications.id, notificationId), eq(notifications.userId, userId)));
  revalidatePath("/notifications");
  return { success: true };
}

export async function clearReadNotificationsAction(): Promise<{ success: boolean }> {
  const userId = await requireUserId();
  await db
    .delete(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, true)));
  revalidatePath("/notifications");
  return { success: true };
}

/**
 * Creates a notification for a specific user (e.g. reply, follow, like, repost).
 * Automatically suppresses self-notifications.
 */
export async function createNotification({
  userId,
  actorId,
  type,
  title,
  message,
  targetUrl,
  imageUrl,
  entityId,
}: {
  userId: string;
  actorId?: string | null;
  type: NotificationType;
  title: string;
  message?: string | null;
  targetUrl: string;
  imageUrl?: string | null;
  entityId?: number | null;
}) {
  if (actorId && actorId === userId) return;

  await db.insert(notifications).values({
    userId,
    actorId: actorId ?? null,
    type,
    title,
    message: message ?? null,
    targetUrl,
    imageUrl: imageUrl ?? null,
    entityId: entityId ?? null,
    isRead: false,
  });

  // Also dispatch real-time native Web Push to the recipient user's devices
  sendPushToUser(userId, {
    title,
    body: message ?? undefined,
    url: targetUrl,
    icon: imageUrl || "/favicon.svg",
  }).catch((err) => {
    console.error("Failed to send push notification:", err);
  });
}

/**
 * Broadcasts an announcement or new publication notification to all registered users.
 */
export async function notifyAllUsers({
  type,
  title,
  message,
  targetUrl,
  imageUrl,
  entityId,
}: {
  type: NotificationType;
  title: string;
  message?: string | null;
  targetUrl: string;
  imageUrl?: string | null;
  entityId?: number | null;
}) {
  const allUsers = await db.select({ id: user.id }).from(user);
  if (allUsers.length > 0) {
    const rows = allUsers.map((u) => ({
      userId: u.id,
      type,
      title,
      message: message ?? null,
      targetUrl,
      imageUrl: imageUrl ?? null,
      entityId: entityId ?? null,
      isRead: false,
    }));

    const chunkSize = 200;
    for (let i = 0; i < rows.length; i += chunkSize) {
      await db.insert(notifications).values(rows.slice(i, i + chunkSize));
    }
  }

  // Also broadcast native Web Push to all subscribed devices
  sendPushToAll({
    title,
    body: message ?? undefined,
    url: targetUrl,
    icon: imageUrl || "/favicon.svg",
  }).catch((err) => {
    console.error("Failed to broadcast push notification:", err);
  });
}
