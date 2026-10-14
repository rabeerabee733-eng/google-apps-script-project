'use strict';
const CACHE_PREFIX = 'tahdir-mobile-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v5';
const ROOT = new URL('./', self.location.href);
const SHELL = ['index.html', 'install-iphone.html', 'app.css?v=5', 'preferences.js?v=5', 'app.js?v=5', 'manifest.webmanifest?v=5', 'apple-touch-icon-v3.png', 'icon-brand-v2-192.png', 'icon-brand-v2-512.png', 'icon-brand-v2-maskable.png'].map(path => new URL(path, ROOT).href);
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL)));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'ACTIVATE_UPDATE') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  // Cache the public launcher only. Never intercept Google, logins, orders, or payments.
  if (request.method !== 'GET' || url.origin !== ROOT.origin) return;
  const isHome = url.pathname === ROOT.pathname || url.pathname === ROOT.pathname + 'index.html';
  const cacheUrl = isHome ? new URL('index.html', ROOT).href : url.href;
  if (!isHome && !SHELL.includes(cacheUrl)) return;
  const freshMetadata = isHome || url.pathname === ROOT.pathname + 'install-iphone.html' || url.pathname === ROOT.pathname + 'manifest.webmanifest';
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    // Read current installation metadata online; preserve the public offline launcher.
    if (freshMetadata) {
      try {
        const response = await fetch(request, {cache: 'no-store'});
        if (response.ok && !response.redirected) {
          await cache.put(cacheUrl, response.clone()).catch(() => {});
          return response;
        }
        return (await cache.match(cacheUrl)) || response;
      } catch (error) {
        const fallback = await cache.match(cacheUrl);
        if (fallback) return fallback;
        throw error;
      }
    }
    const cached = await cache.match(cacheUrl);
    return cached || fetch(request);
  }));
});
