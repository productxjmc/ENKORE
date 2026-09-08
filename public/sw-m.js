// ENKORE mobile shell service worker. Hand-rolled rather than Workbox —
// Phase 0's only job is "the shell still opens with no signal", which is a
// handful of cache-first/network-first rules, not enough surface to justify
// a new dependency. Registered ONLY from src/app/m's layout with
// `{ scope: "/m/" }` (see mobile-app-shell.tsx), so it never touches
// requests to the marketing site, dashboard, or admin — those pages never
// call navigator.serviceWorker.register at all.
//
// Phase 6 (door check-in) will add an IndexedDB-backed queue + Background
// Sync for scans made with no signal — that's separate from this file's
// app-shell caching and lands when that phase is built, not here.

const CACHE_VERSION = "enkore-m-v1";
const SHELL_URLS = ["/m", "/icons/icon-192.png", "/icons/icon-512.png"];

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
  // fresh data win when online, falling back to the cached shell only when
  // the network genuinely fails — never serve a stale screen over a good
  // connection.
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req).catch(() => caches.match("/m").then((res) => res ?? Response.error())),
    );
    return;
  }

  // Static assets under /m (icons, fonts, JS/CSS chunks Next serves under
  // /_next but requested from an /m page): cache-first, since these are
  // content-hashed and safe to serve stale.
  event.respondWith(
    caches.match(req).then((cached) => cached ?? fetch(req).then((res) => {
      if (res.ok) caches.open(CACHE_VERSION).then((cache) => cache.put(req, res.clone()));
      return res;
    })),
  );
});
