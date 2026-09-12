"use client";

import { usePathname } from "next/navigation";

import { useServiceWorkerFreshness } from "@/features/qr/hooks/useServiceWorkerFreshness";

/**
 * Mounted once at the app root (layout.tsx). Only actually guards while the
 * customer is on a /q/** screen — the dashboard has no long-lived polling
 * session exposed to a stale Service Worker the same way.
 */
export function ServiceWorkerFreshnessGuard() {
  const pathname = usePathname();
  const isQrFlow = pathname?.startsWith("/q/") ?? false;

  useServiceWorkerFreshness(isQrFlow);

  return null;
}
