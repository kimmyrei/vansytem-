const CACHE_VERSION =
    "muthaqus-pwa-v109110-3";

const STATIC_CACHE =
    `${CACHE_VERSION}-static`;

const PAGE_CACHE =
    `${CACHE_VERSION}-pages`;

const CORE_FILES = [
    "/",
    "/index.html",
    "/offline.html",
    "/style.css",
    "/app.js",
    "/manifest.webmanifest",
    "/icons/muthaqus-icon-64.png",
    "/icons/muthaqus-icon-192.png",
    "/icons/muthaqus-icon-512.png",
    "/icons/muthaqus-maskable-192.png",
    "/icons/muthaqus-maskable-512.png",
    "/icons/muthaqus-apple-touch-icon.png"
];

self.addEventListener(
    "install",
    event => {
        event.waitUntil(
            caches
                .open(STATIC_CACHE)
                .then(cache =>
                    cache.addAll(CORE_FILES)
                )
        );
    }
);

self.addEventListener(
    "activate",
    event => {
        event.waitUntil(
            caches
                .keys()
                .then(keys =>
                    Promise.all(
                        keys
                            .filter(key =>
                                key.startsWith(
                                    "muthaqus-pwa-"
                                ) &&
                                ![
                                    STATIC_CACHE,
                                    PAGE_CACHE
                                ].includes(key)
                            )
                            .map(key =>
                                caches.delete(key)
                            )
                    )
                )
                .then(() =>
                    self.clients.claim()
                )
        );
    }
);

self.addEventListener(
    "message",
    event => {
        if (
            event.data?.type ===
            "SKIP_WAITING"
        ) {
            self.skipWaiting();
        }
    }
);

async function pageNetworkFirst(
    request
) {
    const cache =
        await caches.open(PAGE_CACHE);

    try {
        const response =
            await fetch(request);

        if (response.ok) {
            cache.put(
                request,
                response.clone()
            );
        }

        return response;
    } catch (error) {
        return (
            await cache.match(request) ||
            await caches.match(
                "/offline.html"
            )
        );
    }
}

async function assetNetworkFirst(
    request
) {
    const cache =
        await caches.open(
            STATIC_CACHE
        );

    try {
        const response =
            await fetch(request);

        if (response.ok) {
            cache.put(
                request,
                response.clone()
            );
        }

        return response;
    } catch (error) {
        return (
            await cache.match(request) ||
            new Response(
                "",
                {
                    status: 504
                }
            )
        );
    }
}

async function assetStaleWhileRevalidate(
    request
) {
    const cache =
        await caches.open(
            STATIC_CACHE
        );

    const cached =
        await cache.match(request);

    const network =
        fetch(request)
            .then(response => {
                if (response.ok) {
                    cache.put(
                        request,
                        response.clone()
                    );
                }

                return response;
            })
            .catch(() => null);

    return (
        cached ||
        await network ||
        new Response(
            "",
            {
                status: 504
            }
        )
    );
}

self.addEventListener(
    "fetch",
    event => {
        const request =
            event.request;

        if (request.method !== "GET") {
            return;
        }

        const url =
            new URL(request.url);

        if (
            url.origin !==
            self.location.origin
        ) {
            return;
        }

        if (
            url.pathname.startsWith(
                "/api/"
            )
        ) {
            event.respondWith(
                fetch(request)
            );
            return;
        }

        if (
            request.mode === "navigate" ||
            request.destination === "document"
        ) {
            event.respondWith(
                pageNetworkFirst(request)
            );
            return;
        }

        if (
            url.pathname === "/app.js" ||
            url.pathname === "/style.css" ||
            url.pathname ===
                "/service-worker.js"
        ) {
            event.respondWith(
                assetNetworkFirst(request)
            );
            return;
        }

        if (
            [
                "style",
                "script",
                "image",
                "font"
            ].includes(
                request.destination
            ) ||
            url.pathname ===
                "/manifest.webmanifest"
        ) {
            event.respondWith(
                assetStaleWhileRevalidate(
                    request
                )
            );
        }
    }
);

self.addEventListener(
    "push",
    event => {
        let data = {};

        try {
            data = event.data
                ? event.data.json()
                : {};
        } catch (error) {
            data = {
                title:
                    "MUTHAQUS Notification",
                body:
                    event.data?.text() ||
                    "You have a new update."
            };
        }

        const title =
            data.title ||
            "MUTHAQUS Notification";

        const options = {
            body:
                data.body ||
                data.message ||
                "You have a new update.",
            icon:
                data.icon ||
                "/icons/muthaqus-icon-192.png",
            badge:
                data.badge ||
                "/icons/muthaqus-icon-64.png",
            image:
                data.image || undefined,
            tag:
                data.tag ||
                `muthaqus-${Date.now()}`,
            renotify:
                data.renotify !== false,
            requireInteraction:
                Boolean(
                    data.requireInteraction
                ),
            vibrate: [
                180,
                80,
                180
            ],
            data: {
                url:
                    data.url ||
                    "/parent-dashboard.html",
                type:
                    data.type ||
                    "General Announcement"
            },
            actions: [
                {
                    action: "open",
                    title: "Open"
                },
                {
                    action: "dismiss",
                    title: "Dismiss"
                }
            ]
        };

        event.waitUntil(
            self.registration
                .showNotification(
                    title,
                    options
                )
        );
    }
);

self.addEventListener(
    "notificationclick",
    event => {
        event.notification.close();

        if (
            event.action === "dismiss"
        ) {
            return;
        }

        const target =
            new URL(
                event.notification
                    .data?.url ||
                "/parent-dashboard.html",
                self.location.origin
            ).href;

        event.waitUntil(
            self.clients
                .matchAll({
                    type: "window",
                    includeUncontrolled: true
                })
                .then(clients => {
                    const existing =
                        clients.find(client =>
                            client.url.startsWith(
                                self.location.origin
                            )
                        );

                    if (existing) {
                        return existing
                            .focus()
                            .then(() =>
                                existing.navigate(
                                    target
                                )
                            );
                    }

                    return self.clients
                        .openWindow(target);
                })
        );
    }
);

// MUTHAQUS_UPDATE_BANNER_REPEAT_FIX

// MUTHAQUS_MINIMAL_MOBILE_QUICK_VIEW
