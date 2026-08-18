const CACHE='impertudo-v8-3';
const ASSETS=["./","./index.html","./css/base.css","./css/theme.css","./js/core.js","./js/product-ui.js","./js/packages.js","./js/calculations.js","./js/proposal.js","./js/assistant.js","./data/products-1.js","./data/products-2.js","./data/products-3.js","./data/products-4.js","./data/products-5.js","./data/products.js","./manifest.webmanifest","./assets/logo-impertudo.svg","./assets/icon.svg"];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{const cp=resp.clone();caches.open(CACHE).then(c=>c.put(e.request,cp));return resp}).catch(()=>caches.match('./index.html'))))});
