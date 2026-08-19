const CACHE='impertudo-v8-2-1';
const CORE=['./','./index.html','./manifest.webmanifest','./css/base.css','./css/theme.css','./css/v82.css'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request).then(resp=>{const copy=resp.clone();caches.open(CACHE).then(c=>c.put('./index.html',copy));return resp;}).catch(()=>caches.match('./index.html')));
  return;
 }
 event.respondWith(caches.match(event.request).then(hit=>hit||fetch(event.request).then(resp=>{
  if(resp&&[0,200].includes(resp.status)){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(event.request,copy));}
  return resp;
 }).catch(()=>caches.match('./index.html'))));
});
