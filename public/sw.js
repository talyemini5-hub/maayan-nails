/**
 * Maayan Nails service worker.
 *
 * Deliberately conservative: this is a booking site where a stale "available"
 * slot shown offline is worse than no offline support at all. So:
 *   - API routes and anything on *.supabase.co are NEVER intercepted —
 *     they always hit the network, cache or no cache.
 *   - Only the offline fallback page and hashed Next.js static assets
 *     (_next/static/**, immutable by filename) are cached.
 *   - Navigations try the network first and only fall back to the cached
 *     offline page when the network truly fails.
 */
const CACHE_NAME = "maayan-nails-v1";
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll([OFFLINE_URL]))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Never cache API calls, auth callbacks, or anything Supabase — booking
  // availability and session state must always be live.
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/") || url.hostname.endsWith(".supabase.co")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
