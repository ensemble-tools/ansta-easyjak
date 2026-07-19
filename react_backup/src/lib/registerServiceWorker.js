export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  const baseUrl = new URL(import.meta.env.BASE_URL || './', window.location.href);
  const basePath = baseUrl.pathname.endsWith('/') ? baseUrl.pathname : `${baseUrl.pathname}/`;
  const swUrl = `${basePath}sw.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope: basePath }).catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
