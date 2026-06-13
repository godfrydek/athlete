const CACHE = 'training-arc-os-v10-historic-cache-v1';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./manifest.json','./sw.js',
  './css/v9-ulti.css','./css/v10-historic.css',
  './js/v9-addon.js','./js/v10-addon.js',
  './data/v9-foods.js','./data/v9-recipes.js','./data/v10-foods.js','./data/v10-recipes.js','./data/v10-exercises.js','./data/v10-quotes.js',
  './README.md','./supabase.sql',
  './docs/HOSTING.md','./docs/SUPABASE.md','./docs/SECURITY.md','./docs/PAYMENTS.md','./docs/CHANGELOG.md','./docs/V10_MODULES.md'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(res => {
    const clone = res.clone();
    caches.open(CACHE).then(cache => cache.put(event.request, clone)).catch(()=>{});
    return res;
  }).catch(()=>cached)));
});
