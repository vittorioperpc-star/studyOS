/* StudyOS Web Push Service Worker */
self.addEventListener("push", (event) => {
  let data = { title: "StudyOS", body: "Hai una notifica" };
  try { data = event.data.json(); } catch (_) {}
  const opts = {
    body: data.body || "",
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    data: { url: data.url || "/" },
  };
  event.waitUntil(self.registration.showNotification(data.title || "StudyOS", opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(url) && "focus" in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
