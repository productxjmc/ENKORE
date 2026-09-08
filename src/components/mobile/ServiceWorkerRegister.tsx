"use client";

import { useEffect } from "react";

// Scoped to /m/ specifically — the dashboard, admin, and marketing pages
// never mount this component, so they never register a service worker at
// all. See public/sw-m.js for what the scope actually caches.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw-m.js", { scope: "/m/" }).catch((err) => {
      console.error("[mobile] service worker registration failed:", err);
    });
  }, []);

  return null;
}
