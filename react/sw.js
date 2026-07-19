self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => Promise.all(keys.filter((key) => key.includes('easyjak-react-preview')).map((key) => caches.delete(key)))),
      self.registration.unregister(),
      self.clients.claim(),
    ]),
  );
});
