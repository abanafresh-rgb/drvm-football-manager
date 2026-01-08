
const CACHE_NAME = 'drvm-fm-v3';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Oswald:wght@500;700&display=swap',
  'https://cdn-icons-png.flaticon.com/512/53/53283.png'
];

// Install event - activate immediately and pre-cache static assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Attempt to cache core assets, but don't fail install if one fails (e.g. external fonts sometimes flaky)
      return cache.addAll(URLS_TO_CACHE).catch(err => console.log('SW: Pre-cache warning', err));
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Cache First strategy with Network fallback, excluding API
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests (e.g., Gemini API POSTs)
  if (event.request.method !== 'GET') return;
  
  // Skip chrome-extension requests or other non-http schemes
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network
      return fetch(event.request).then((response) => {
        // Check for valid response
        if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors' && response.type !== 'opaque')) {
          return response;
        }

        // Clone response to store in cache
        const responseToCache = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          // Don't cache Gemini API calls
          if (!event.request.url.includes('generativelanguage.googleapis.com')) {
             cache.put(event.request, responseToCache);
          }
        });

        return response;
      }).catch(() => {
        // Fallback behavior if offline and not in cache
        // We could return a custom offline page here
      });
    })
  );
});
