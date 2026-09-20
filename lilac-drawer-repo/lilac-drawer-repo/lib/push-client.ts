"use client";

/**
 * Helper to convert standard base64 URL VAPID key to Uint8Array required by pushManager.subscribe()
 */
export function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return reg;
  } catch (err) {
    console.error("Service Worker registration failed:", err);
    return null;
  }
}

export async function getCurrentPushSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

export async function subscribeToPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) {
    return { success: false, error: "Web push notifications are not supported on this browser or device." };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      return { success: false, error: "Notification permission was denied." };
    }

    const reg = await registerServiceWorker();
    if (!reg) {
      return { success: false, error: "Failed to initialize service worker." };
    }

    const readyReg = await navigator.serviceWorker.ready;

    // Get VAPID key
    let vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      const res = await fetch("/api/push/subscribe");
      const data = await res.json();
      vapidKey = data.publicKey;
    }

    if (!vapidKey) {
      return { success: false, error: "VAPID key not available." };
    }

    let sub = await readyReg.pushManager.getSubscription();
    if (!sub) {
      sub = await readyReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
      });
    }

    // Send subscription to backend
    const subJson = sub.toJSON();
    const saveRes = await fetch("/api/push/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        endpoint: sub.endpoint,
        keys: {
          p256dh: subJson.keys?.p256dh,
          auth: subJson.keys?.auth,
        },
      }),
    });

    if (!saveRes.ok) {
      const errData = await saveRes.json().catch(() => ({}));
      return { success: false, error: errData.error || "Failed to save subscription on server." };
    }

    return { success: true };
  } catch (err: any) {
    console.error("Subscription error:", err);
    return { success: false, error: err?.message || "An unexpected error occurred while subscribing." };
  }
}

export async function unsubscribeFromPush(): Promise<{ success: boolean; error?: string }> {
  if (!isPushSupported()) return { success: true };

  try {
    const readyReg = await navigator.serviceWorker.ready;
    const sub = await readyReg.pushManager.getSubscription();
    if (sub) {
      const endpoint = sub.endpoint;
      await sub.unsubscribe();

      await fetch("/api/push/subscribe", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint }),
      }).catch(() => {});
    }
    return { success: true };
  } catch (err: any) {
    console.error("Unsubscribe error:", err);
    return { success: false, error: err?.message || "Failed to unsubscribe." };
  }
}
