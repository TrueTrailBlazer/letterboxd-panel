// Service Worker - Letterboxd Panel
// Estratégia: Cache-First para recursos estáticos, Network-First para APIs

var CACHE_NAME = 'lbxd-panel-v1';
var STATIC_ASSETS = [
  '/',
  '/css/style.css',
  '/js/home.js',
  '/js/config.js',
  '/js/i18n.js',
  '/js/quotes.js',
  '/js/onboarding.js',
  '/manifest.json',
];

// Install: cache dos recursos estáticos
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: limpar caches antigos
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.filter(function(name) {
          return name !== CACHE_NAME;
        }).map(function(name) {
          return caches.delete(name);
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-First para estáticos, Network-First para APIs
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Nunca cachear requisições de API
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(function() {
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  // Cache-First para tudo o mais (CSS, JS, HTML, imagens)
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) {
        // Retorna do cache imediatamente, mas atualiza em background
        var fetchPromise = fetch(event.request).then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, networkResponse);
            });
          }
          return networkResponse.clone();
        }).catch(function() { /* offline, ignora */ });
        
        return cached;
      }

      // Se não está no cache, busca da rede
      return fetch(event.request).then(function(networkResponse) {
        if (networkResponse && networkResponse.status === 200) {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
