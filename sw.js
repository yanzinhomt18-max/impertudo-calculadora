const CACHE='impertudo-v8-3';
const CORE=[
 './','./index.html','./manifest.webmanifest',
 './assets/logo-impertudo.svg','./assets/icon.svg',
 './css/base.css','./css/theme.css','./css/v82.css','./css/v83.css',
 './data/products-1.js','./data/products-2.js','./data/products-3.js','./data/products-4.js','./data/products-5.js','./data/products.js',
 './js/catalog-cache.js','./js/core.js','./js/product-ui.js','./js/packages.js','./js/calculations.js','./js/proposal.js','./js/assistant.js',
 './js/v82-area.js','./js/v82-calc.js','./js/v82-package-range.js','./js/v82-proposal.js','./js/v82-init.js',
 './js/v83-stability.js','./js/v83-commercial.js','./js/v83-install.js',
 './vendor/jspdf.umd.min.js'
];

self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET')return;
 const url=new URL(req.url);
 if(url.origin!==self.location.origin)return;

 if(req.mode==='navigate'){
  event.respondWith(
   fetch(req).then(resp=>{
    if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));}
    return resp;
   }).catch(()=>caches.match('./index.html'))
  );
  return;
 }

 // Arquivos estáticos: cache-first. Nunca retorna HTML no lugar de JS/CSS/imagem.
 event.respondWith(
  caches.match(req).then(hit=>hit||fetch(req).then(resp=>{
   if(resp&&resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy));}
   return resp;
  }))
 );
});
