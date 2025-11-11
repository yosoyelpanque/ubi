// sw.js (Service Worker)

// 1. Definimos el nombre y la versión del caché.
// Si actualizas la app, cambia 'v1' a 'v2' para forzar la actualización del caché.
const CACHE_NAME = 'inventario-pro-cache-v1';

// 2. Archivos que componen el "App Shell" y que guardaremos.
const urlsToCache = [
  './', // La raíz de la app
  'index.html',
  'styles.css',
  'app.js',
  'manifest.json',
  // Es crucial cachear también las librerías externas
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://unpkg.com/html5-qrcode',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdn.jsdelivr.net/npm/interactjs/dist/interact.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  // Cachear las fuentes también (opcional pero recomendado)
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  // Deberás agregar aquí las imágenes/iconos que uses (ej. el logo y los íconos de la PWA)
  // 'images/logo.png',
  // 'images/icon-192x192.png',
  // 'images/icon-512x512.png'
];

// 3. Evento 'install': Se dispara cuando el SW se instala.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  // Esperamos a que el caché se abra y todos nuestros archivos se guarden.
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abriendo caché y guardando app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forzamos la activación del nuevo SW
      .catch(err => {
        console.error('Service Worker: Falló el cacheo del app shell', err);
      })
  );
});

// 4. Evento 'activate': Se dispara cuando el SW se activa (reemplaza a uno viejo).
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          // Si el nombre del caché no es el actual, lo borramos.
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpiando caché antiguo', cache);
            return caches.delete(cache);
          }
        })
      );
    })
    .then(() => self.clients.claim()) // Toma control de la página inmediatamente
  );
});

// 5. Evento 'fetch': Se dispara cada vez que la app pide un recurso (CSS, JS, imagen, etc.)
self.addEventListener('fetch', event => {
  // Usamos una estrategia "Cache First" (Primero caché)
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si encontramos una respuesta en el caché, la devolvemos.
        if (response) {
          // console.log('Service Worker: Sirviendo desde caché', event.request.url);
          return response;
        }

        // Si no, vamos a la red a buscarlo.
        // console.log('Service Worker: Buscando en red', event.request.url);
        return fetch(event.request)
          .then(networkResponse => {
            // (Opcional) Podríamos guardar esta nueva respuesta en el caché para la próxima vez
            // No lo haremos por defecto para las librerías de CDN, para permitir que se actualicen.
            return networkResponse;
          })
          .catch(err => {
            console.error('Service Worker: Fallo de fetch', err);
            // Podríamos devolver una página offline personalizada aquí si quisiéramos.
          });
      })
  );
});