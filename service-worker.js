const CACHE_VERSION =
    "muthaqus-pwa-v108-1";

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
                .then(() =>
                    self.skipWaiting()
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
