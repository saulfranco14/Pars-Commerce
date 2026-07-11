import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, RuntimeCaching, SerwistGlobalConfig } from "serwist";
import { NetworkFirst, Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

/**
 * Custom rules for the live QR customer flow, matched BEFORE the stock
 * defaultCache. These routes are real-time (menu, bill, payments), so the
 * stock terminal `NetworkOnly` catch-all was dead-ending them with a cryptic
 * `no-response` error on any network blip. NetworkFirst with a short timeout
 * serves the network normally and, only if it fails, falls back to the last
 * response — the bill polls every few seconds so a one-tick-stale fallback is
 * far better than a crash.
 */
const qrRuntimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/api/qr/"),
    handler: new NetworkFirst({
      cacheName: "qr-api",
      networkTimeoutSeconds: 8,
    }),
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
  runtimeCaching: [...qrRuntimeCaching, ...defaultCache],
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
