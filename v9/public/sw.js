const CACHE = 'impertudo-v9-__BUILD_ID__'
const PRECACHE = '/precache.json'

async function installShell() {
  const manifestResponse = await fetch(PRECACHE, { cache: 'no-store' })
  if (!manifestResponse.ok) throw new Error('Não foi possível carregar o precache da V9.')
  const manifest = await manifestResponse.json()
  const urls = Array.isArray(manifest.urls) ? manifest.urls : ['/']
  const cache = await caches.open(CACHE)
  await cache.addAll([...new Set([...urls, PRECACHE])])
}

self.addEventListener('install', (event) => {
  event.waitUntil(installShell())
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) caches.open(CACHE).then((cache) => cache.put('/', response.clone()))
          return response
        })
        .catch(() => caches.match('/'))
    )
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, response.clone()))
      return response
    }))
  )
})
