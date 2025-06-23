const CACHE_NAME = 'panekkatt-money-tracker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/js/main.*.js',
  '/static/css/main.*.css',
  '/manifest.json',
  '/logo192.png',
  '/logo512.png',
  '/favicon.ico'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
  // Filter out non-HTTP requests (including chrome-extension://)
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Only cache HTTP/HTTPS URLs
                if (event.request.url.startsWith('http') && 
                    // Don't cache Firebase API calls
                    !event.request.url.includes('firebaseio.com') && 
                    !event.request.url.includes('googleapis.com')) {
                  try {
                    cache.put(event.request, responseToCache);
                  } catch (error) {
                    console.error('Error caching resource:', error);
                  }
                }
              });
              
            return response;
          }
        ).catch(error => {
          console.error('Fetch failed:', error);
          // Return a fallback response or just let the error propagate
          // return new Response('Network error happened', { status: 408 });
        });
      })
  );
});

// Update service worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
}); 