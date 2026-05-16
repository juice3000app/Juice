const CACHE = 'juice-v2';
const SHELL = [
  '/juice/',
  '/juice/index.html',
  'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.js',
  'https://api.mapbox.com/mapbox-gl-js/v3.4.0/mapbox-gl.css',
  'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Space+Mono:wght@400;700&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Network first for Mapbox tiles and geocoding (need live data)
  // Cache first for app shell
  const url = new URL(e.request.url);
  const isMapboxApi = url.hostname.includes('mapbox.com') && 
                      (url.pathname.includes('/tiles/') || 
                       url.pathname.includes('/geocoding/') ||
                       url.pathname.includes('/styles/'));

  if (isMapboxApi) {
    // Network first, fall back to cache
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    // Cache first, fall back to network
    e.respondWith(
      caches.match(e.request).then(cached => cached || fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, clone));
        return res;
      }))
    );
  }
});
