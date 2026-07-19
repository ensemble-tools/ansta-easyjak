export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  if (!import.meta.env.PROD) return;

  const baseUrl = import.meta.env.BASE_URL;
  if (baseUrl !== '/') return;

  const swUrl = `${baseUrl}sw.js`;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register(swUrl, { scope: baseUrl }).catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  });
}
