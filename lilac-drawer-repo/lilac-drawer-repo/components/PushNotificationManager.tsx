"use client";

import { useEffect } from "react";
import { registerServiceWorker, getCurrentPushSubscription } from "@/lib/push-client";
import { useSession } from "@/lib/auth-client";

export default function PushNotificationManager() {
  const { data: session } = useSession();
  const userId = session?.user?.id;

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    registerServiceWorker().then(async () => {
      // If the device is already subscribed and user is logged in, sync the subscription with their user id
      if (userId) {
        const sub = await getCurrentPushSubscription();
        if (sub) {
          const subJson = sub.toJSON();
          if (subJson.keys?.p256dh && subJson.keys?.auth) {
            fetch("/api/push/subscribe", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                endpoint: sub.endpoint,
                keys: {
                  p256dh: subJson.keys.p256dh,
                  auth: subJson.keys.auth,
                },
              }),
            }).catch(() => {});
          }
        }
      }
    });
  }, [userId]);

  return null;
}
