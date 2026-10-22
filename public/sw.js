const CACHE_NAME = "pestpilot-cache-v2";
const OFFLINE_FALLBACK = "/offline.html";

// Only precache static, non-authenticated public assets
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/offline.html",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("[Service Worker] Purging stale cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Completely bypass APIs, Next.js internal chunks/RSC, and non-GET requests
  if (
    request.method !== "GET" ||
    request.url.includes("/api/") ||
    request.url.includes("/_next/") ||
    request.url.includes("?_rsc=")
  ) {
    return;
  }

  // Handle HTML navigation requests
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const cachedFallback = await cache.match(OFFLINE_FALLBACK);
        return cachedFallback || new Response("Offline", { status: 503 });
      })
    );
    return;
  }

  // Network-first with cache fallback for static public assets
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) return cachedResponse;
        return new Response("Not available offline", { status: 503 });
      })
  );
});

