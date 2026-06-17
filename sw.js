// AzEstetik Enhanced Service Worker v3
// ─────────────────────────────────────
// Full offline support with cache-first strategy and background sync

const CACHE_NAME = 'azestetik-cache-v8';
const DYNAMIC_CACHE = 'azestetik-dynamic-v6';

const STATIC_ASSETS = [
  './',
  'ambassador_dashboard.html',
  'ambassador_branches.html',
  'ambassador_academy.html',
  'ambassador_analytics.html',
  'ambassador_ai.html',
  'ambassador_bonuses.html',
  'ambassador_customers.html',
  'ambassador_events.html',
  
  
  'ambassador_settings.html',
  'ambassador_support.html',
  'ambassador_style.css',
  'database_inline.js',
  'firebase_service.js',
  'app_core.js',
  'pwa_installer.js',
  'assets/azestetik_app_icon.png',
  'manifest.json'
];

// Install: Cache all static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing v3...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching ' + STATIC_ASSETS.length + ' static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating v3...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Cache-first with network fallback + dynamic caching
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests and Chrome extensions
  if (event.request.method !== 'GET') return;
  if (event.request.url.startsWith('chrome-extension://')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cache, but update in background (stale-while-revalidate)
        event.waitUntil(
          fetch(event.request).then((freshResponse) => {
            if (freshResponse && freshResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, freshResponse);
              });
            }
          }).catch(() => { /* offline, ignore */ })
        );
        return cachedResponse;
      }

      // Not in cache: fetch from network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) return response;

        // Cache dynamic resources (CDN, fonts, etc.)
        const responseClone = response.clone();
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      }).catch(() => {
        // Offline fallback
        if (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html')) {
          return caches.match('ambassador_dashboard.html');
        }
      });
    })
  );
});

// Push Notifications
self.addEventListener('push', (event) => {
  let data = { title: 'AzEstetik', body: 'Yeni bildiriş var!' };
  
  if (event.data) {
    try { data = event.data.json(); } catch (e) { data.body = event.data.text(); }
  }

  const options = {
    body: data.body,
    icon: 'assets/azestetik_app_icon.png',
    badge: 'assets/azestetik_app_icon.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || 'ambassador_dashboard.html' },
    actions: [
      { action: 'open', title: 'Aç' },
      { action: 'close', title: 'Bağla' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url || '/');
    })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-ambassadors') {
    console.log('[SW] Background sync triggered');
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SYNC_REQUESTED' });
        });
      })
    );
  }
});
