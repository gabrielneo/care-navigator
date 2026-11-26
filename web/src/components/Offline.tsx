"use client";
// 9.13: registers the service worker (public/sw.js), then saves what this first visit already loaded, which the
// worker didn't see because it wasn't running yet. Production only, so development builds never get stale.
import { useEffect } from "react";

export function Offline() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    let seen: PerformanceObserver | undefined;
    // Saving a file fetches it, which the observer reports again, so each file is saved once only.
    const kept = new Set<string>();
    const keep = (urls: string[]) => {
      const fresh = urls.filter((u) => new URL(u, location.href).origin === location.origin && !kept.has(u));
      fresh.forEach((u) => kept.add(u));
      // Files already saved on an earlier visit aren't fetched again.
      return caches.open("care-navigator-v1").then((c) => Promise.all(fresh.map((u) => c.match(u).then((hit) => (hit ? undefined : c.add(u))))));
    };
    navigator.serviceWorker.register("/sw.js").then(() => navigator.serviceWorker.ready).then(() => {
      // Everything loaded so far, and anything loaded later (the places data arrives after the first screen).
      seen = new PerformanceObserver((list) => { keep(list.getEntries().map((e) => e.name)).catch(() => {}); });
      seen.observe({ type: "resource", buffered: true });
      return keep([location.pathname]);
    }).then(() => document.documentElement.setAttribute("data-offline-ready", ""))
      .catch(() => {});                                   // offline use is a bonus; the site works without it
    return () => seen?.disconnect();
  }, []);
  return null;
}
