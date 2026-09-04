const CACHE_NAME = 'dbc-cache-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  // Purge all old caches on activation to prevent stale chunk lock
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Ignore non-GET requests and API calls
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api')) {
    return;
  }

  // Navigation requests (HTML pages) -> ALWAYS Network Only (Never cache HTML)
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return caches.match('/index.html');
      })
    );
    return;
  }

  // Version-hashed static assets in /assets/ -> Cache First with Network Fallback
  if (url.pathname.startsWith('/assets/')) {
    e.respondWith(
      caches.match(e.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(e.request).then((response) => {
          if (response.ok && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, clone));
          }
          return response;
        }).catch((err) => {
          // If asset fetch fails (404 / stale chunk), purge cache
          caches.delete(CACHE_NAME);
          throw err;
        });
      })
    );
    return;
  }
});
