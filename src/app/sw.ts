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
 * Custom rules for the live QR customer flow, matched BEFORE the stock
 * defaultCache.
 *
 * `/api/qr/` GETs (pulse, bill, admin-view, resolve) and every mutation
 * (items, fulfillment, payments, close, merge...) are NetworkOnly — every
 * one of them is either live polling data or a state-changing action, and
 * NetworkFirst was caching each successful response in "qr-api" and
 * occasionally serving that stale copy back on a subsequent request (the
 * cause of a real bug: a customer's tracker staying on an old
 * fulfillment_status for a full extra polling cycle after staff advanced
 * it). A network blip on one of these should surface as a visible error
 * the UI already handles, not a silent stale read.
 *
 * Only the customer-facing DOCUMENT shell (`/q/**` pages) keeps
 * NetworkFirst — that's static UI chrome, not per-request state, so a
 * short-lived fallback on a network blip is safe and improves resilience.
 */
const qrRuntimeCaching: RuntimeCaching[] = [
  {
    matcher: ({ sameOrigin, url }) =>
      sameOrigin && url.pathname.startsWith("/api/qr/"),
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
