const CACHE = 'training-arc-os-v11-barfix-2026-06-13';
const STATIC_ASSETS = [
  './style.css?v=11.1.0','./app.js?v=11.1.0','./manifest.json','./sw.js',
  './css/v9-ulti.css?v=11.1.0','./css/v10-historic.css?v=11.1.0','./css/v11-clean.css?v=11.1.0','./css/v11-barfix.css?v=11.1.0',
  './js/v9-addon.js?v=11.1.0','./js/v10-addon.js?v=11.1.0','./js/v11-clean-deploy.js?v=11.1.0','./js/v11-barfix.js?v=11.1.0',
  './data/v9-foods.js?v=11.1.0','./data/v9-recipes.js?v=11.1.0','./data/v10-foods.js?v=11.1.0','./data/v10-recipes.js?v=11.1.0','./data/v10-exercises.js?v=11.1.0','./data/v10-quotes.js?v=11.1.0'
];
self.addEventListener('install', event => {
  event.waitUntil((async()=>{
    const cache = await caches.open(CACHE);
    await cache.addAll(STATIC_ASSETS).catch(()=>{});
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async()=>{
    if (self.registration.navigationPreload) { try { await self.registration.navigationPreload.enable(); } catch(e) {} }
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => /training-arc-os/i.test(k) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
    const clients = await self.clients.matchAll({type:'window', includeUncontrolled:true});
    for (const client of clients) {
      try {
        const u = new URL(client.url);
        if (u.pathname.endsWith('/athlete/') || u.pathname.endsWith('/athlete/index.html')) { u.search=''; u.hash=''; client.navigate(u.href); }
      } catch(e) {}
    }
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const req = event.request;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    event.respondWith((async()=>{
      try {
        const preload = await event.preloadResponse;
        const res = preload || await fetch(req, {cache:'no-store'});
        const cache = await caches.open(CACHE);
        cache.put('./index.html', res.clone()).catch(()=>{});
        return res;
      } catch(e) {
        return (await caches.match('./index.html')) || new Response('Offline — Training Arc OS v11 BarFix cache not ready.', {headers:{'Content-Type':'text/plain'}});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cached = await caches.match(req);
    const fetchPromise = fetch(req, {cache:'no-store'}).then(async res => {
      const cache = await caches.open(CACHE);
      cache.put(req, res.clone()).catch(()=>{});
      return res;
    }).catch(()=>cached);
    return fetchPromise || cached;
  })());
});
