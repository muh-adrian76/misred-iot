// Service Worker untuk MiSREd IoT - Mobile Notification Support
// File ini mendukung notifikasi browser di perangkat mobile

const CACHE_NAME = 'misred-iot-v1';
const STATIC_CACHE_URLS = [
  '/',
  '/web-logo.svg',
  '/misred-blue.png',
  '/misred-red.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker installed successfully');
        self.skipWaiting(); // Force activation
      })
      .catch((error) => {
        console.error('❌ Service Worker install failed:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker activating...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker activated');
        return self.clients.claim(); // Take control of all pages
      })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip WebSocket and API requests
  if (event.request.url.includes('/ws/') || 
      event.request.url.includes('/api/') ||
      event.request.url.startsWith('ws://') ||
      event.request.url.startsWith('wss://')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request)
          .catch(() => {
            // Fallback for offline scenarios
            if (event.request.destination === 'document') {
              return caches.match('/');
            }
          });
      })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Handle notification click - focus app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // If app is already open, focus it
        for (const client of clients) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            // Send message to app about notification click
            client.postMessage({
              type: 'notification-click',
              notificationId: event.notification.tag,
              data: event.notification.data
            });
            return;
          }
        }
        
        // If app is not open, open it
        return self.clients.openWindow('/');
      })
  );
});

// Background sync for offline notifications (optional)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-notifications') {
    console.log('🔄 Background sync: notifications');
    event.waitUntil(
      // Could implement offline notification queue here
      Promise.resolve()
    );
  }
});

// Push notification handler (for future PWA features)
self.addEventListener('push', (event) => {
  console.log('📨 Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'Ada update baru dari MiSREd IoT',
      icon: '/web-logo.svg',
      badge: '/web-logo.svg',
      tag: data.tag || 'misred-push',
      requireInteraction: false,
      silent: false
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'MiSREd IoT', options)
    );
  }
});

// Error handler
self.addEventListener('error', (event) => {
  console.error('❌ Service Worker error:', event.error);
});

// Unhandled promise rejection
self.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Service Worker unhandled rejection:', event.reason);
});
