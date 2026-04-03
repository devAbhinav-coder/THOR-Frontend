self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (_err) {
    data = {};
  }

  const title = data.title || "New notification";
  const options = {
    body: data.body || "You have a new update.",
    icon: data.icon || "/favicon.png",
    badge: data.badge || "/favicon.png",
    tag: data.tag || "in-app-notification",
    data: {
      link: data.link || "/",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ("focus" in client) {
            client.navigate(link);
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow(link);
      }),
  );
});
