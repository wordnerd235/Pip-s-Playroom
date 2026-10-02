/* Pip's Playroom — offline support. Network-first for the page (so updates arrive), cache fallback when offline. */
const CACHE = 'pips-playroom-{{VERSION}}';
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).catch(() => {}).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE && k !== 'pips-voice').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) {
    e.respondWith(
      fetch(req)
        .then((r) => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put('./index.html', copy)); } return r; })
        .catch(() => caches.match('./index.html').then((r) => r || caches.match('./')))
    );
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(CACHE).then((c) => c.match(req).then((hit) => hit || fetch(req).then((res) => { c.put(req, res.clone()); return res; }))));
    return;
  }
  if (url.origin === location.origin && /\/voice\/manifest\.json$/.test(url.pathname)) {
    // voice manifest: network first (so a new voice pack is picked up), cache fallback offline
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((k) => k.put(req, c)); } return r; })
      .catch(() => caches.match(req)));
    return;
  }
  if (url.origin === location.origin && /\/voice\//.test(url.pathname)) {
    // voice pack files are content-hashed: cache first, keep forever (survives app updates)
    e.respondWith(caches.open('pips-voice').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin === location.origin) e.respondWith(caches.match(req).then((r) => r || fetch(req)));
});
