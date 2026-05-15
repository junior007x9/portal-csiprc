const CACHE_NAME = 'portal-csiprc-v1';

// O que o telemóvel deve guardar na memória para a App abrir muito rápido
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js'
];

// Instala a App no telemóvel
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Faz a App funcionar puxando os dados
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});