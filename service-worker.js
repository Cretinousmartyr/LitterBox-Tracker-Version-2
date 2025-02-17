const CACHE_NAME = "litter-box-cache-v1";
const urlsToCache = [
  "/", // caches the root (adjust if your site is in a subfolder)
  "/index.html",
  "/styles.css",
  "/app.js",
];

// Install event – cache essential files.
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
  // Force the waiting service worker to become active.
  self.skipWaiting();
});

// Activate event – clean up old caches.
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch event – serve cached assets if available.
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached response if found; otherwise, fetch from network.
      return response || fetch(event.request);
    })
  );
});
