import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";

const STATION_SECTIONS = Object.fromEntries(STATIONS.map((s) => [stationSection(s.key), [s.permission]]));

/**
 * Which permission opens each dashboard section. The sidebar, the bottom nav,
 * the page guard and the role editor preview all read this map, so what a
 * role sees in the menu and what it can open can't disagree.
 *
 * `anyOf` = holding one is enough. A section missing here is open to every
 * active member. The API still authorizes on its own: this map decides what
 * to SHOW, not what to allow.
 */
export const DASHBOARD_SECTION_PERMISSIONS: Record<string, readonly string[]> = {
  // Work stations: each person sees only the steps they do.
  operacion: STATIONS.map((s) => s.permission),
  ...STATION_SECTIONS,
  // The tenant home is a business summary (sales, setup, catalog). Roles that
  // only operate (waiter, preparer, courier) land on their work instead.
  inicio: ["reports.read"],
  // Catalog and stock are for who manages them. Order takers still pick products
  // inside the order sheet, which reads the catalog through its own API.
  productos: ["products.read"],
  servicios: ["products.read"],
  // The full order list is for who takes or oversees orders; preparation and
  // delivery work from their station instead.
  ordenes: ["orders.view_all", "order.take"],
  pedidos: ["order.take"],
  cotizaciones: ["order.take"],
  agenda: ["orders.view_all", "order.take"],
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

export const HOME_SECTION = "inicio";

/** Where a role lands when it can't open the home: its daily work first. */
const LANDING_ORDER = [
  "inicio",
  ...STATIONS.map((s) => stationSection(s.key)),
  "ordenes",
  "mesas",
  "agenda",
  "cotizaciones",
  "productos",
  "clientes",
];

// Top-level dashboard routes that are not a tenant.
const ACCOUNT_ROUTES = new Set(["plataforma", "perfil", "crear-negocio", "preparar-negocio"]);

/**
 * Section of a dashboard path: the first segment after `/dashboard/[tenantSlug]/`
 * (`operacion/<station>` for a station), `"inicio"` for the tenant home (and
 * `/dashboard`), `null` for account routes.
 */
export function dashboardSectionOf(pathname: string): string | null {
  const parts = pathname.split("?")[0].split("/").filter(Boolean);
  if (parts[0] !== "dashboard") return null;
  if (parts.length === 1) return HOME_SECTION;
  if (ACCOUNT_ROUTES.has(parts[1])) return null;
  if (parts[2] === "operacion" && parts[3]) return `operacion/${parts[3]}`;
  return parts[2] ?? HOME_SECTION;
}

export function sectionPermissions(section: string | null): readonly string[] {
  if (!section) return [];
  return DASHBOARD_SECTION_PERMISSIONS[section] ?? [];
}

/** First section the role can open, following `LANDING_ORDER`. */
export function landingSection(canOpen: (section: string) => boolean): string | null {
  return LANDING_ORDER.find(canOpen) ?? null;
}
