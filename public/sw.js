// Feynman Challenge service worker.
//
// Rules:
// - Navigations are NETWORK-ONLY. Authenticated HTML is never cached; when
//   the network fails, the precached /offline page is shown instead.
// - /_next/static/* (content-hashed, immutable) is cache-first.
// - Everything else (API, Storage, RSC payloads) is left to the browser.
// - Caches are versioned by the build (?v= in the registration URL). A new
//   build installs, waits, and takes over only when the page asks
//   (SKIP_WAITING, sent from the "Versi baru tersedia" toast).
// - CLEAR_CACHES (sent on logout) wipes every cache, then re-precaches the
//   user-free offline page.

const VERSION = new URL(self.location.href).searchParams.get("v") || "dev";
const PREFIX = "feynman-";
const STATIC_CACHE = `${PREFIX}static-${VERSION}`;
const OFFLINE_CACHE = `${PREFIX}offline-${VERSION}`;
const OFFLINE_URL = "/offline";
const EXTRA_ASSETS = ["/icon.svg", "/icons/icon-192.png"];

/** Build assets referenced by an HTML document. */
function staticAssetsIn(html) {
  const found = html.match(/\/_next\/static\/[^"'\s\\<>()]+/g) || [];
  return [...new Set(found)];
}

/**
 * Caches /offline plus the build assets it needs, so the fallback renders
 * fully styled with no network. Fetched WITHOUT cookies: never user data.
 */
async function precacheOffline() {
  const response = await fetch(OFFLINE_URL, { cache: "reload", credentials: "omit" });
  if (!response.ok || response.redirected) {
    throw new Error(`offline page unavailable (${response.status})`);
  }
  const html = await response.clone().text();
  const offline = await caches.open(OFFLINE_CACHE);
  await offline.put(OFFLINE_URL, response);

  const assets = await caches.open(STATIC_CACHE);
  await Promise.all(
    [...staticAssetsIn(html), ...EXTRA_ASSETS].map((url) =>
      assets.add(url).catch(() => undefined),
    ),
  );
}

async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(keys.map((key) => caches.delete(key)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(precacheOffline());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Drop other builds' caches, and the v1 cache that stored page HTML.
      const keep = new Set([STATIC_CACHE, OFFLINE_CACHE]);
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith(PREFIX) && !keep.has(key))
          .map((key) => caches.delete(key)),
      );
      if (self.registration.navigationPreload) {
        await self.registration.navigationPreload.enable();
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "SKIP_WAITING") {
    self.skipWaiting();
  } else if (type === "CLEAR_CACHES") {
    event.waitUntil(
      clearAllCaches()
        .then(precacheOffline)
        .catch(() => undefined),
    );
  }
});

async function offlineFallback() {
  const cached = await caches.match(OFFLINE_URL, { cacheName: OFFLINE_CACHE });
  if (cached) return cached;
  return new Response(
    '<!doctype html><html lang="id"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline</title><body style="font-family:system-ui,sans-serif;background:#101218;color:#eef0f5;padding:2rem"><h1>Kamu sedang offline</h1><p>Sambungkan internet, lalu muat ulang halaman ini.</p></body></html>',
    { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

async function networkOnlyNavigation(event) {
  try {
    const preloaded = await event.preloadResponse;
    if (preloaded) return preloaded;
    return await fetch(event.request);
  } catch {
    return offlineFallback();
  }
}

async function cacheFirst(event) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(event.request);
  if (cached) return cached;
  const response = await fetch(event.request);
  if (response.ok) {
    event.waitUntil(cache.put(event.request, response.clone()));
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(networkOnlyNavigation(event));
    return;
  }
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(event));
  }
});
