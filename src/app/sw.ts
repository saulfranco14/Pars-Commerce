import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, NetworkOnly, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Custom rules for live and authenticated data, matched BEFORE the stock
 * defaultCache.
 *
 * Every `/api/` request is NetworkOnly. The stock Serwist cache otherwise
 * applies NetworkFirst to API GETs, which is unsafe for sessions, platform
 * permissions, balances, orders and the live QR flow. A failed response must
 * never be replayed from a service worker cache to another user/session.
 *
 * Only the customer-facing DOCUMENT shell (`/q/**` pages) keeps
 * NetworkFirst — that's static UI chrome, not per-request state, so a
 * short-lived fallback on a network blip is safe and improves resilience.
 */
const appRuntimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/api/"),
    handler: new NetworkOnly(),
  },
  {
    matcher: ({ request, sameOrigin, url }) =>
      sameOrigin &&
      request.destination === "document" &&
      url.pathname.startsWith("/q/"),
    handler: new NetworkFirst({
      cacheName: "qr-pages",
      networkTimeoutSeconds: 8,
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...appRuntimeCaching, ...defaultCache],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
