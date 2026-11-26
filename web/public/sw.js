// 9.13: a plan already opened reopens without signal (wards and polyclinics often have none). Only this site's own
// files are kept, never answers: those live after the # in the link, which never reaches a request.
// Pages and data try the network first, so figures stay current when there's signal; the build's hashed scripts
// never change, so they come from the cache first.
// shortcut: old builds' scripts stay in the cache until the browser clears it; prune by build ID if it ever matters.
const CACHE = "care-navigator-v1";

const keep = (req, res) => {
  if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
  return res;
};

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/_next/static/")) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => keep(req, res))));
    return;
  }
  e.respondWith(fetch(req).then((res) => keep(req, res))
    .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || Response.error())));
});
