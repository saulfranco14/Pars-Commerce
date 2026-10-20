/**
 * Which permission opens each dashboard section. The sidebar, the bottom nav,
 * the page guard and the role editor preview all read this map, so what a
 * role sees in the menu and what it can open can't disagree.
 *
 * `anyOf` = holding one is enough. A section missing here is open to every
 * active member (e.g. Inicio). The API still authorizes on its own: this map
 * decides what to SHOW, not what to allow.
 */
export const DASHBOARD_SECTION_PERMISSIONS: Record<string, readonly string[]> = {
  // Catalog and stock are for who manages them. Order takers still pick products
  // inside the order sheet, which reads the catalog through its own API.
  productos: ["products.read"],
  servicios: ["products.read"],
  ordenes: ["orders.read"],
  pedidos: ["order.take"],
  cotizaciones: ["order.take"],
  agenda: ["orders.read"],
  mesas: ["qr.read"],
  qr: ["qr.write"],
  promociones: ["promotions.read"],
  suscripciones: ["sales.read"],
  prestamos: ["sales.read"],
  credito: ["sales.read"],
  clientes: ["sales.read"],
  ventas: ["money.read"],
  liquidaciones: ["money.read"],
  equipo: ["team.write"],
  "sitio-web": ["settings.write"],
  configuracion: ["settings.write"],
  novedades: ["settings.read"],
};

/** First path segment after `/dashboard/[tenantSlug]/`, or `null` for the tenant home. */
export function dashboardSectionOf(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts[0] !== "dashboard" || parts.length < 3) return null;
  return parts[2];
}

export function sectionPermissions(section: string | null): readonly string[] {
  if (!section) return [];
  return DASHBOARD_SECTION_PERMISSIONS[section] ?? [];
}
