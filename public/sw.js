const CACHE_NAME = "coverme-v2";
const CORE_ASSETS = [
    "/manifest.webmanifest",
    "/apple-touch-icon.png",
    "/icons/icon-192.png",
    "/icons/icon-512.png",
    "/icons/maskable-512.png",
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const requestUrl = new URL(event.request.url);
    if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
    if (event.request.mode === "navigate") return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response.ok && ["image", "manifest", "script", "style", "font"].includes(event.request.destination)) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            })
            .catch(() => caches.match(event.request)),
    );
});

self.addEventListener("push", (event) => {
    const data = event.data?.json() || {};
    const title = data.title || "CoverMe";

    event.waitUntil(
        self.registration.showNotification(title, {
            body: data.body || "A new shift is open.",
            icon: data.icon || "/icons/icon-192.png",
            badge: data.badge || "/icons/icon-192.png",
            image: data.image,
            requireInteraction: Boolean(data.requireInteraction),
            data: { url: data.url || "/" },
            tag: data.tag || "coverme-shift",
        }),
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || "/", self.location.origin).href;

    event.waitUntil(
        self.clients
            .matchAll({ type: "window", includeUncontrolled: true })
            .then((clients) => {
                const existing = clients.find((client) => client.url === url);
                if (existing) return existing.focus();
                return self.clients.openWindow(url);
            }),
    );
});
