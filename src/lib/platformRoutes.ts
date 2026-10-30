// Super admin screens are cross-tenant: no business chrome (switcher, legal notice, tenant menu).
export function isPlatformRoute(pathname: string): boolean {
  return pathname === "/dashboard/plataforma" || pathname.startsWith("/dashboard/plataforma/");
}

// The prospecting team works outside any business too; a prospector may have no business at all.
export function isProspectingRoute(pathname: string): boolean {
  return pathname === "/dashboard/prospeccion" || pathname.startsWith("/dashboard/prospeccion/");
}
