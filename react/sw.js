const CACHE_VERSION = 'easyjak-react-preview-v1';
const BASE_PATH = '/ansta-easyjak/react/';
const PRECACHE_URLS = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}img.png`,
  `${BASE_PATH}icons/icon-192.png`,
  `${BASE_PATH}icons/icon-512.png`,
  `${BASE_PATH}icons/apple-touch-icon.png`,
];

async function getBuildAssetUrls() {
  try {
    const response = await fetch(`${BASE_PATH}index.html`, { cache: 'no-store' });
    if (!response.ok) return [];

    const html = await response.text();
    const urls = new Set();
    const assetPattern = /(?:src|href)="([^"]*\/assets\/[^"]+)"/g;
    let match = assetPattern.exec(html);

    while (match) {
      urls.add(new URL(match[1], self.location.origin).pathname);
      match = assetPattern.exec(html);
    }

    return [...urls];
  } catch (error) {
    return [];
  }
}

function isYoutubeRequest(url) {
  return (
    url.hostname === 'youtu.be'
    || url.hostname.endsWith('.youtube.com')
    || url.hostname.endsWith('.youtube-nocookie.com')
    || url.hostname.endsWith('.googlevideo.com')
    || url.hostname === 'img.youtube.com'
  );
}

function isReactStaticAsset(url) {
  return (
    url.pathname.startsWith(`${BASE_PATH}assets/`)
    || url.pathname === `${BASE_PATH}manifest.webmanifest`
    || url.pathname === `${BASE_PATH}img.png`
    || url.pathname.startsWith(`${BASE_PATH}icons/`)
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === 'basic') {
    const cache = await caches.open(CACHE_VERSION);
    cache.put(request, response.clone());
  }
  return response;
}

async function navigationFallback(request) {
  try {
    const response = await fetch(request);
    if (response.ok && response.type === 'basic') {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(BASE_PATH, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(BASE_PATH);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([caches.open(CACHE_VERSION), getBuildAssetUrls()])
      .then(([cache, buildAssetUrls]) => cache.addAll([...PRECACHE_URLS, ...buildAssetUrls]))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isYoutubeRequest(url)) return;
  if (url.origin !== self.location.origin) return;
  if (!url.pathname.startsWith(BASE_PATH)) return;
  if (url.pathname === `${BASE_PATH}sw.js`) return;

  if (request.mode === 'navigate') {
    event.respondWith(navigationFallback(request));
    return;
  }

  if (isReactStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  }
});
