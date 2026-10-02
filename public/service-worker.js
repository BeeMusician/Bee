const CACHE_NAME = "beesyrup-cache-v2"; // Increment version for fresh cache installation
const ASSETS = [
  "/",
  "/favicon.svg",
  "/style.css",
  "/PWA192.png",
  "/PWA512.png"
];

// Install Service Worker and cache resources resiliently
self.addEventListener("install", (event) => {
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Safe caching loop: prevents 1 missing image from breaking entire service worker installation
      return Promise.allSettled(
        ASSETS.map((asset) => 
          cache.add(asset).catch((err) => {
            console.error(`⚠️ Failed to cache asset: ${asset}`, err);
          })
        )
      );
    })
  );
});

self.addEventListener("activate", (event) => {
  // Clean up old caches if CACHE_NAME changes
  event.waitUntil(
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

// Handle incoming requests
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // 1. Check if request is for a /release page
  if (url.pathname.startsWith("/release")) {
    
    // If it has a trailing slash, explicitly pass it to network so Express handles the 301
    if (url.pathname.endsWith("/")) {
      e.respondWith(fetch(e.request));
      return; 
    }

    // Force release pages to fetch fresh from network
    e.respondWith(
      fetch(e.request).catch(() => {
        if (e.request.mode === "navigate") {
          return caches.match("/") || new Response("Offline", { status: 503 });
        }
      })
    );
    return;
  }

  // 2. Default behavior for static assets / homepage
  e.respondWith(
    caches.match(e.request).then((response) => {
      return response || fetch(e.request);
    })
  );
});