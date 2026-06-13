const CACHE = 'training-arc-os-v9-ulti-cache-v1';
const ASSETS = [
  './','./index.html','./style.css','./app.js','./manifest.json','./sw.js',
  './css/v9-ulti.css','./js/v9-addon.js','./data/v9-foods.js','./data/v9-recipes.js',
  './README.md','./supabase.sql'
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
