// Super admin screens are cross-tenant: no business chrome (switcher, legal notice, tenant menu).
export function isPlatformRoute(pathname: string): boolean {
  return pathname === "/dashboard/plataforma" || pathname.startsWith("/dashboard/plataforma/");
}
