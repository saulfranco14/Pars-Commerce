"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Keeps published ads true to the catalog: after a price or name change the
 * next dashboard screen redraws them. Loads the drawing code only when needed.
 */
export function StudioAutoRefresh({ tenantId }: { tenantId: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const open = /\/studio\/disenos\/([0-9a-f-]{36})/.exec(pathname)?.[1];
    const timer = setTimeout(() => {
      void import("../services/studioAutoRefresh")
        .then(({ refreshStaleStudioAds }) =>
          refreshStaleStudioAds(tenantId, open),
        )
        .catch(() => {});
    }, 1500);
    return () => clearTimeout(timer);
  }, [tenantId, pathname]);
  return null;
}
