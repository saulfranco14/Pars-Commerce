"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** Counts one view per page the shopper opens; previews of unpublished stores are not counted. */
export function StoreViewBeacon({ tenantId }: { tenantId: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!tenantId || pathname.startsWith("/vista-previa")) return;
    const body = JSON.stringify({ tenantId });
    try {
      if (!navigator.sendBeacon?.("/api/public/sitio/view", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/public/sitio/view", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch {
      /* counting a view must never break the store */
    }
  }, [pathname, tenantId]);

  return null;
}
