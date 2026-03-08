// KISAN-OS Service Worker - Fixed Version
// No pre-caching of URLs that return 404

const STATIC_CACHE = 'kisan-os-static-v4';
const DYNAMIC_CACHE = 'kisan-os-dynamic-v4';
const API_CACHE = 'kisan-os-api-v4';

// Only cache files that definitely exist
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html',
];

// Install event - cache with error handling
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      console.log('[SW] Caching static assets');
      // Cache each file individually, don't fail on errors
      for (const url of STATIC_ASSETS) {
        try {
          const response = await fetch(url, { mode: 'no-cors' });
          if (response.ok || response.type === 'opaque') {
            await cache.put(url, response);
          }
        } catch (e) {
          console.log('[SW] Could not cache:', url);
        }
      }
    }).then(() => caches.open(API_CACHE))
      .then(() => caches.open(DYNAMIC_CACHE))
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys.filter((key) => 
          key !== STATIC_CACHE && 
          key !== DYNAMIC_CACHE && 
          key !== API_CACHE
        ).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // API calls
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Static assets - cache first
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Pages - network first
  event.respondWith(networkFirst(request));
});

function isStaticAsset(pathname) {
  return (
    pathname.endsWith('.js') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico') ||
    pathname.endsWith('.woff') ||
    pathname.endsWith('.woff2') ||
    pathname.endsWith('.ttf') ||
    pathname.endsWith('.webp')
  );
}

// Cache first strategy
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Offline', { status: 503 });
  }
}

// Network first strategy  
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Try default cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Try dynamic cache
    const dynCache = await caches.open(DYNAMIC_CACHE);
    const dynResp = await dynCache.match(request);
    if (dynResp) return dynResp;

    // Try API cache
    const apiCache = await caches.open(API_CACHE);
    const apiResp = await apiCache.match(request);
    if (apiResp) return apiResp;

    // For navigation, return offline page
    if (request.mode === 'navigate') {
      const offlinePage = await caches.match('/offline.html');
      if (offlinePage) return offlinePage;
    }

    return new Response('Offline', { status: 503 });
  }
}

// API handler
async function handleApiRequest(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Offline' }), { 
      status: 503, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }
}

// Handle messages
self.addEventListener('message', (event) => {
  if (event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(keys => 
        Promise.all(keys.map(key => caches.delete(key)))
      )
    );
  }
});

console.log('[SW] Service worker loaded');
