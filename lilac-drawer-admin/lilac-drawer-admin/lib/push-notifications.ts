import webpush from "web-push";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { pushSubscriptions } from "@/db/schema";

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
      console.warn("VAPID keys not configured in admin. Push notifications disabled.");
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

    const batchSize = 25;
    for (let i = 0; i < allSubs.length; i += batchSize) {
      const batch = allSubs.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (sub) => {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth,
                },
              },
              payloadJson
            );
          } catch (err: any) {
            if (err?.statusCode === 404 || err?.statusCode === 410) {
              await db
                .delete(pushSubscriptions)
                .where(eq(pushSubscriptions.endpoint, sub.endpoint))
                .catch(() => {});
            }
          }
        })
      );
    }
  } catch (err) {
    console.error("Error broadcasting push notification from admin:", err);
  }
}
