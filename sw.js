const CACHE_NAME = 'hoshii-yaritai-v11';
// self.registration.scope 基準の相対パス（サブパス配信のGitHub Pages等でも動くように）
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './src/main.js',
  './src/App.js',
  './src/styles.css',
  './src/config.js',
  './src/lib/supabaseClient.js',
  './src/lib/api.js',
  './src/lib/format.js',
  './src/components/BottomNav.js',
  './src/components/DailyStockView.js',
  './src/components/WishListView.js',
  './src/components/EfficiencyView.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-180.png',
].map((p) => new URL(p, self.registration.scope).toString());

const INDEX_URL = new URL('./index.html', self.registration.scope).toString();

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  // Supabase へのAPIリクエストはキャッシュせず常にネットワークから取得する
  if (req.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => {
          if (req.mode === 'navigate') return caches.match(INDEX_URL);
          return cached;
        });
      return cached || fetchPromise;
    })
  );
});
