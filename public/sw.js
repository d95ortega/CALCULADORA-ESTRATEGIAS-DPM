const CACHE_NAME = 'dpm-calc-v1';
const ASSETS = [
  '/CALCULADORA-ESTRATEGIAS-DPM/',
  '/CALCULADORA-ESTRATEGIAS-DPM/index.html',
  '/CALCULADORA-ESTRATEGIAS-DPM/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
