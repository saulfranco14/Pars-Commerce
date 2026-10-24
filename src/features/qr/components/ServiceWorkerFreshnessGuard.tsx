"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { useServiceWorkerFreshness } from "@/features/qr/hooks/useServiceWorkerFreshness";

/**
 * Mounted once at the app root (layout.tsx). Besides the long-lived QR flow,
 * the marketing shell is guarded too: a deploy can otherwise serve fresh RSC
 * HTML alongside an old client bundle still controlled by a Service Worker.
 */
export function ServiceWorkerFreshnessGuard() {
  const pathname = usePathname();
  const isQrFlow = pathname?.startsWith("/q/") ?? false;
  const isMarketingPage = pathname === "/" || pathname?.startsWith("/soluciones/") || false;

  useServiceWorkerFreshness(isQrFlow || isMarketingPage);

  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    if (!("serviceWorker" in navigator) || sessionStorage.getItem("tlaco:dev-sw-reset")) return;

    let cancelled = false;
    sessionStorage.setItem("tlaco:dev-sw-reset", "1");

    void navigator.serviceWorker.getRegistrations().then(async (registrations) => {
      const cacheNames = await caches.keys();
      await Promise.all(registrations.map((registration) => registration.unregister()));
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      if (!cancelled && (registrations.length > 0 || cacheNames.length > 0)) {
        window.location.reload();
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
