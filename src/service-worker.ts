/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { env } from './config/env';

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<ManifestEntry>;
};

interface ManifestEntry {
  revision?: string | null;
  url: string;
}

const fileExtensionRegexp = /\/[^/?]+\.[^/]+$/;
const apiUrl = new URL(env.apiUrl, self.location.origin);
const apiPathname = apiUrl.pathname.replace(/\/$/, '');

clientsClaim();
precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  ({ request, url }) =>
    request.mode === 'navigate' &&
    !url.pathname.startsWith('/api') &&
    !fileExtensionRegexp.test(url.pathname),
  createHandlerBoundToURL('/index.html'),
);

registerRoute(
  ({ request }) => request.destination === 'image' || request.destination === 'font',
  new CacheFirst({
    cacheName: 'aurea-static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ request, url }) => {
    if (request.method !== 'GET') return false;

    const matchesPath = url.pathname.startsWith(apiPathname) || url.pathname.startsWith('/api');
    const matchesOrigin = url.origin === apiUrl.origin || url.origin === self.location.origin;

    return matchesPath && matchesOrigin;
  },
  new NetworkFirst({
    cacheName: 'aurea-api-cache',
    networkTimeoutSeconds: 5,
    plugins: [
      {
        cacheWillUpdate: async ({ response }) =>
          response?.status === 200 ? response : null,
      },
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60,
      }),
    ],
  }),
);

registerRoute(
  ({ url }) =>
    url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({ cacheName: 'aurea-external-fonts' }),
);

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});