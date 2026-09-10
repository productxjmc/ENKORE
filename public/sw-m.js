// ENKORE mobile shell service worker. Hand-rolled rather than Workbox —
// Phase 0's only job is "the shell still opens with no signal", which is a
// handful of cache-first/network-first rules, not enough surface to justify
// a new dependency. Registered ONLY from src/app/m's layout with
// `{ scope: "/m/" }` (see mobile-app-shell.tsx), so it never touches
// requests to the marketing site, dashboard, or admin — those pages never
// call navigator.serviceWorker.register at all.
//
// Phase 6 (door check-in) added a localStorage-backed retry queue for
// scans made with no signal (src/components/mobile/TicketScanner.tsx) —
// simpler than IndexedDB + Background Sync, see that file's own comment
// for why. Phase 8 applies the same queue pattern to Community Wall
// posts and booking requests (src/lib/offlineQueue.ts).

const CACHE_VERSION = "enkore-m-v3";
const SHELL_URLS = ["/m", "/icons/icon-192.png", "/icons/icon-512.png"];

// Public, non-personalized pages only — a signed-in musician's Studio or
// Payouts screen must never be served from cache while offline (stale
// earnings/order data read as current is worse than an offline error).
// Storefronts, the musicians list, and the Home feed are the "cached
// storefronts" Phase 8's plan item actually asked for.
function isPubliclyCacheableNav(pathname) {
  return pathname === "/m" || pathname === "/m/musicians" || pathname.startsWith("/m/u/");
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin || !url.pathname.startsWith("/m")) return;

  // Navigations (loading a screen): network-first, so signed-in state and
  // fresh data win when online, falling back to a cached copy only when
  // the network genuinely fails — never serve a stale screen over a good
  // connection. Public pages get opportunistically cached on every
  // successful visit, so a storefront seen once is still viewable
  // offline later; the fallback tries that exact page before dropping
  // back to the generic app shell.
  if (req.mode === "navigate") {
    const cacheable = isPubliclyCacheableNav(url.pathname);
    event.respondWith(
      fetch(req)
        .then((res) => {
          // waitUntil is required here, not optional — without it the
          // browser can terminate this worker as soon as respondWith's
          // own promise resolves, before this background write finishes.
          if (res.ok && cacheable) {
            event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone())));
          }
          return res;
        })
        .catch(() =>
          caches.match(req).then((exact) => exact ?? caches.match("/m")).then((res) => res ?? Response.error()),
        ),
    );
    return;
  }

  // Static assets under /m (icons, fonts, JS/CSS chunks Next serves under
  // /_next but requested from an /m page): cache-first, since these are
  // content-hashed and safe to serve stale. Same waitUntil fix as the
  // navigate branch above — the write must outlive respondWith's promise.
  event.respondWith(
    caches.match(req).then((cached) => cached ?? fetch(req).then((res) => {
      if (res.ok) event.waitUntil(caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone())));
      return res;
    })),
  );
});
