'use strict';
const CACHE_PREFIX = 'tahdir-mobile-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v1';
const ROOT = new URL('./', self.location.href);
const SHELL = ['index.html', 'app.css', 'app.js', 'manifest.webmanifest', 'icon.svg', 'icon-180.png', 'icon-192.png', 'icon-512.png'].map(path => new URL(path, ROOT).href);
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
  event.respondWith(caches.open(CACHE_NAME).then(async cache => {
    const cached = await cache.match(cacheUrl);
    return cached || fetch(request);
  }));
});
