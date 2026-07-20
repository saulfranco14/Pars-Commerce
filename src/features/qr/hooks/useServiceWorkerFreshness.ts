"use client";

import { useEffect } from "react";

/** How often to actively check for a new Service Worker while this screen
 *  stays open. The browser already checks on navigation, but /q/** tabs can
 *  stay open for a long time (a customer sitting at their table) without
 *  ever navigating again, so that alone isn't enough. */
const UPDATE_CHECK_INTERVAL_MS = 60_000;

/**
 * Guards the customer-facing QR flow against a stale Service Worker serving
 * outdated runtime-caching rules for a long-lived session. Concretely fixes:
 * a customer has /q/{token} open, staff deploys a new build, the browser's
 * ALREADY-ACTIVE (pre-deploy) service worker keeps intercepting
 * /api/qr/resolve and /api/qr/table/pulse under its old rules — even after
 * `skipWaiting`/`clientsClaim`, activation isn't instant while the tab has
 * open network activity (the pulse itself). The result observed in
 * production: a stale cached response makes the client think the table's
 * order changed, incorrectly ending the session ("Esta cuenta se cerró").
 *
 * Two-pronged fix:
 *   1. Proactively call `registration.update()` on an interval — don't only
 *      rely on the browser's own "check on navigation" timing.
 *   2. The moment a NEW service worker takes control (`controllerchange`),
 *      reload immediately. A one-time reload mid-session is a much smaller
 *      disruption than silently running stale caching rules through a
 *      payment flow.
 */
export function useServiceWorkerFreshness(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (!("serviceWorker" in navigator)) return;

    let reloaded = false;
    function handleControllerChange() {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      handleControllerChange,
    );

    const intervalId = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      navigator.serviceWorker.getRegistration().then((registration) => {
        registration?.update().catch(() => {
          /* transient network error — try again next interval */
        });
      });
    }, UPDATE_CHECK_INTERVAL_MS);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
      window.clearInterval(intervalId);
    };
  }, [enabled]);
}
