import webpush from "web-push";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";
import { auth } from "@/lib/auth";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || "mailto:notifications@lilacdrawer.com";

let vapidConfigured = false;
function ensureVapid(): boolean {
  if (!vapidConfigured) {
    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      vapidConfigured = true;
    } else {
      console.warn("VAPID keys not configured. Web push notifications are disabled.");
    }
  }
  return vapidConfigured;
}

export interface PushPayload {
  title: string;
  body?: string | null;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Saves or updates a browser push subscription.
 * Links to the current authenticated user if logged in, otherwise preserves subscription as guest.
 */
export async function savePushSubscription(
  sub: PushSubscriptionData,
  explicitUserId?: string | null
): Promise<{ success: boolean }> {
  let userId = explicitUserId ?? null;
  if (userId === undefined || userId === null) {
    try {
      const session = await auth.api.getSession({ headers: await headers() });
      userId = session?.user?.id ?? null;
    } catch {
      userId = null;
    }
  }

  await db
    .insert(pushSubscriptions)
    .values({
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: {
        userId,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        updatedAt: new Date(),
      },
    });

  return { success: true };
}

/**
 * Removes a push subscription by its unique endpoint when a user revokes permission or toggles off.
 */
export async function removePushSubscription(endpoint: string): Promise<{ success: boolean }> {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
  return { success: true };
}

/**
 * Sends a web push notification to a single registered subscription endpoint.
 * Automatically cleans up expired/unregistered subscriptions (HTTP 404 or 410).
 */
async function sendSinglePush(
  sub: { endpoint: string; p256dh: string; auth: string },
  payloadJson: string
) {
  try {
    const pushSub = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      },
    };
    await webpush.sendNotification(pushSub, payloadJson);
  } catch (err: any) {
    // 404 Not Found or 410 Gone means the subscription has expired or was unsubscribed on client
    if (err && (err.statusCode === 404 || err.statusCode === 410)) {
      console.log(`Pruning expired push subscription: ${sub.endpoint.slice(0, 40)}...`);
      await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint)).catch(() => {});
    } else {
      console.error("Failed to deliver push notification:", err?.message || err);
    }
  }
}

/**
 * Dispatches a push notification to all devices owned by a specific user.
 */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!ensureVapid()) return;

  try {
    const subscriptions = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (subscriptions.length === 0) return;

    const formattedPayload: PushPayload = {
      title: payload.title || "Lilac Drawer",
      body: payload.body || "",
      icon: payload.icon || "/favicon.svg",
      badge: payload.badge || "/favicon.svg",
      url: payload.url || "/",
      tag: payload.tag || `lilac-user-${userId}-${Date.now()}`,
    };

    const payloadJson = JSON.stringify(formattedPayload);
    await Promise.allSettled(subscriptions.map((sub) => sendSinglePush(sub, payloadJson)));
  } catch (err) {
    console.error(`Error sending push notification to user ${userId}:`, err);
  }
}

/**
 * Broadcasts a push notification to all subscribed devices (both logged-in users and guests).
 * Used when a new article or deal is published.
 */
export async function sendPushToAll(payload: PushPayload) {
  if (!ensureVapid()) return;

  try {
    const allSubs = await db
      .select({
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions);

    if (allSubs.length === 0) return;

    const formattedPayload: PushPayload = {
      title: payload.title || "Lilac Drawer",
      body: payload.body || "",
      icon: payload.icon || "/favicon.svg",
      badge: payload.badge || "/favicon.svg",
      url: payload.url || "/",
      tag: payload.tag || `lilac-broadcast-${Date.now()}`,
    };

    const payloadJson = JSON.stringify(formattedPayload);

    // Send in batches of 25 to avoid overwhelming network/memory
    const batchSize = 25;
    for (let i = 0; i < allSubs.length; i += batchSize) {
      const batch = allSubs.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((sub) => sendSinglePush(sub, payloadJson)));
    }
  } catch (err) {
    console.error("Error broadcasting push notifications:", err);
  }
}
