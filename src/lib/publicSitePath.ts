import type { Tenant } from "@/types/database";

/** Storefront path. The storefront resolves `site_slug`, which gets a suffix when the plain name was already taken. */
export function publicSitePath(tenant: Pick<Tenant, "slug" | "site_slug">): string {
  return `/sitio/${tenant.site_slug || tenant.slug}`;
}
