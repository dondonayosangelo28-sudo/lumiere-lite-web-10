const CACHE_NAME = 'lumiere-crew-cache-v1'
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon.svg',
]

// Install event — cache app shell static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE)
    }).then(() => self.skipWaiting())
  )
})

// Activate event — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => self.clients.claim())
  )
})

// Fetch event — network-first for /api requests, cache-first for static shell assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Bypass API requests to let online/offline logic handle REST calls
  if (url.pathname.startsWith('/api/')) {
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update for cached static files
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse))
          }
        }).catch(() => {})
        return cachedResponse
      }
      return fetch(event.request)
    })
  )
})
