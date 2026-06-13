const CACHE = 'training-arc-os-v10-historic-hardfix-2026-06-13';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./manifest.json','./sw.js',
  './css/v9-ulti.css','./css/v10-historic.css',
  './js/v9-addon.js','./js/v10-addon.js','./js/v10-visible-fix.js',
  './data/v9-foods.js','./data/v9-recipes.js','./data/v10-foods.js','./data/v10-recipes.js','./data/v10-exercises.js','./data/v10-quotes.js',
  './README.md','./supabase.sql',
  './docs/HOSTING.md','./docs/SUPABASE.md','./docs/SECURITY.md','./docs/PAYMENTS.md','./docs/CHANGELOG.md','./docs/V10_MODULES.md'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE && /training-arc-os/i.test(k)).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith(fetch(req).then(res => {
      const clone = res.clone();
      caches.open(CACHE).then(cache => cache.put(req, clone)).catch(()=>{});
      return res;
    }).catch(() => caches.match(req).then(cached => cached || caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => {
    const clone = res.clone();
    caches.open(CACHE).then(cache => cache.put(req, clone)).catch(()=>{});
    return res;
  }).catch(()=>cached)));
});
