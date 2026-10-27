"use client";

import { publicSitePath } from "@/lib/publicSitePath";
import { useActiveTenant } from "@/stores/useTenantStore";

/** Storefront path for a dashboard tenant; falls back to its slug until the tenant list has loaded. */
export function usePublicSitePath(tenantSlug: string): string {
  const activeTenant = useActiveTenant();
  return publicSitePath(activeTenant?.slug === tenantSlug ? activeTenant : { slug: tenantSlug });
}
