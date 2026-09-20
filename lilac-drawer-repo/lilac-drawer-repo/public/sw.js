// Service Worker for Lilac Drawer Web Push Notifications

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload = {};
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: "Lilac Drawer",
      body: event.data.text(),
      url: "/",
    };
  }

  const title = payload.title || "Lilac Drawer";
  const options = {
    body: payload.body || "",
    icon: payload.icon || "/favicon.svg",
    badge: payload.badge || "/favicon.svg",
    tag: payload.tag || ("lilac-notification-" + Date.now()),
    renotify: true,
    data: {
      url: payload.url || "/",
      dateOfArrival: Date.now(),
    },
    vibrate: [100, 50, 100],
    actions: payload.actions || [],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || "/";
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Check if an existing tab can be focused
      for (const client of clientList) {
        if (client.url === absoluteUrl && "focus" in client) {
          return client.focus();
        }
      }
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          if ("navigate" in client) {
            client.navigate(absoluteUrl);
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(absoluteUrl);
      }
    })
  );
});
