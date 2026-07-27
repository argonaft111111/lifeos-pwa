const CACHE_NAME = 'lifeos-v3';

const APP_FILES = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache =>
        cache.addAll(APP_FILES)
      )
  );

  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(
              key => key !== CACHE_NAME
            )
            .map(
              key => caches.delete(key)
            )
        )
      ),

      self.clients.claim()
    ])
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl =
    new URL(event.request.url);

  const isAppFile =
    requestUrl.origin ===
    self.location.origin;

  /*
   * Для наших файлів:
   * спочатку мережа,
   * потім кеш.
   */
  if (isAppFile) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy =
            response.clone();

          caches
            .open(CACHE_NAME)
            .then(cache => {
              cache.put(
                event.request,
                copy
              );
            });

          return response;
        })
        .catch(async () => {
          const cached =
            await caches.match(
              event.request
            );

          if (cached) {
            return cached;
          }

          if (
            event.request.mode ===
            'navigate'
          ) {
            return caches.match(
              './index.html'
            );
          }

          throw new Error(
            'Offline'
          );
        })
    );

    return;
  }

  /*
   * Зовнішні запити service worker
   * не чіпає.
   */
});
