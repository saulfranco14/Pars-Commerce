import {
  BadgePercent,
  BarChart3,
  Banknote,
  CalendarClock,
  ClipboardList,
  FileText,
  Globe,
  Landmark,
  Package,
  QrCode,
  Repeat,
  Scissors,
  Settings,
  ShieldCheck,
  Sparkles,
  Table2,
  Users,
  UsersRound,
  Wallet,
} from "lucide-react";

import { STATIONS, stationSection } from "@/features/operaciones/constants/stations";
import { dashboardSectionOf } from "@/constants/dashboardAccess";

import type { LucideIcon } from "lucide-react";

export type MenuGroupKey = "operacion" | "gestion" | "cobranza" | "administracion";

export const MENU_GROUPS: readonly { key: MenuGroupKey; label: string }[] = [
  { key: "operacion", label: "Operación" },
  { key: "gestion", label: "Gestión del negocio" },
  { key: "cobranza", label: "Cobranza" },
  { key: "administracion", label: "Administración" },
];

export interface MenuItemDef {
  /** Path under `/dashboard/[tenantSlug]/`; also the item's id in preferences. */
  path: string;
  label: string;
  icon: LucideIcon;
  group: MenuGroupKey;
  /** Also active on sub-pages (`/productos/123`). */
  matchChildren?: boolean;
  /** Always shown: hiding it would hide the way back to this editor. */
  locked?: boolean;
}

/** Every entry of the business menu in its default order. Inicio stays fixed on top. */
export const MENU_ITEMS: readonly MenuItemDef[] = [
  ...STATIONS.map((s) => ({ path: stationSection(s.key), label: s.label, icon: s.icon, group: "operacion" as const })),
  { path: "productos", label: "Productos", icon: Package, group: "gestion", matchChildren: true },
  { path: "servicios", label: "Servicios", icon: Scissors, group: "gestion", matchChildren: true },
  { path: "promociones", label: "Promociones", icon: BadgePercent, group: "gestion", matchChildren: true },
  { path: "ordenes", label: "Órdenes / Tickets", icon: ClipboardList, group: "gestion", matchChildren: true },
  { path: "cotizaciones", label: "Cotizaciones", icon: FileText, group: "gestion" },
  { path: "agenda", label: "Agenda", icon: CalendarClock, group: "gestion" },
  { path: "suscripciones", label: "Suscripciones", icon: Repeat, group: "gestion", matchChildren: true },
  { path: "qr", label: "Códigos QR", icon: QrCode, group: "gestion", matchChildren: true },
  { path: "mesas", label: "Mesas", icon: Table2, group: "gestion", matchChildren: true },
  { path: "prestamos", label: "Préstamos", icon: Banknote, group: "cobranza", matchChildren: true },
  { path: "credito", label: "Crédito de clientes", icon: Wallet, group: "cobranza" },
  { path: "clientes", label: "Clientes", icon: Users, group: "cobranza", matchChildren: true },
  { path: "ventas", label: "Ventas y comisiones", icon: BarChart3, group: "administracion", matchChildren: true },
  { path: "liquidaciones", label: "Mi dinero", icon: Wallet, group: "administracion", matchChildren: true },
  { path: "equipo", label: "Equipo", icon: UsersRound, group: "administracion" },
  { path: "equipo/roles", label: "Roles y permisos", icon: ShieldCheck, group: "administracion", matchChildren: true },
  { path: "sitio-web", label: "Sitio web", icon: Globe, group: "administracion" },
  { path: "configuracion", label: "Configuración", icon: Settings, group: "administracion", locked: true },
  { path: "configuracion/cuentas-bancarias", label: "Cuentas bancarias", icon: Landmark, group: "administracion" },
  { path: "novedades", label: "Novedades", icon: Sparkles, group: "administracion" },
];

/** What a business chose: group order, entry order (by path) and which entries it hides. */
export interface MenuPreferences {
  groups: MenuGroupKey[];
  order: string[];
  hidden: string[];
}

const KNOWN_PATHS = new Set(MENU_ITEMS.map((i) => i.path));

/** Reads `tenants.settings.menu`, ignoring anything that isn't a known entry. */
export function menuPreferencesOf(settings: unknown): MenuPreferences {
  const menu = (settings as { menu?: { groups?: unknown; order?: unknown; hidden?: unknown } } | null)?.menu;
  const clean = (value: unknown) =>
    Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && KNOWN_PATHS.has(v)) : [];
  const lockedPaths = new Set(MENU_ITEMS.filter((i) => i.locked).map((i) => i.path));
  const groupKeys = new Set<string>(MENU_GROUPS.map((g) => g.key));
  const groups = Array.isArray(menu?.groups)
    ? (menu.groups as unknown[]).filter((g): g is MenuGroupKey => typeof g === "string" && groupKeys.has(g))
    : [];
  return {
    groups: [...new Set(groups)],
    order: clean(menu?.order),
    hidden: clean(menu?.hidden).filter((p) => !lockedPaths.has(p)),
  };
}

/** Groups in the business's order; a group it never placed keeps its default spot after the rest. */
export function orderedGroups(prefs: MenuPreferences): (typeof MENU_GROUPS)[number][] {
  const rank = (key: MenuGroupKey) => {
    const i = prefs.groups.indexOf(key);
    return i === -1 ? prefs.groups.length + MENU_GROUPS.findIndex((g) => g.key === key) : i;
  };
  return [...MENU_GROUPS].sort((a, b) => rank(a.key) - rank(b.key));
}

export function menuItemSection(item: MenuItemDef): string | null {
  return dashboardSectionOf(`/dashboard/negocio/${item.path}`);
}

/** Items of one group in the business's order; new entries keep their default place at the end. */
export function orderedGroupItems(group: MenuGroupKey, prefs: MenuPreferences): MenuItemDef[] {
  const items = MENU_ITEMS.filter((i) => i.group === group);
  const rank = (path: string) => {
    const i = prefs.order.indexOf(path);
    return i === -1 ? prefs.order.length + MENU_ITEMS.findIndex((m) => m.path === path) : i;
  };
  return [...items].sort((a, b) => rank(a.path) - rank(b.path));
}

/** The menu a person sees: the business's order and choices, then their role's permissions. */
export function resolveMenu(
  prefs: MenuPreferences,
  canOpen: (section: string | null) => boolean,
): { key: MenuGroupKey; label: string; items: MenuItemDef[] }[] {
  const hidden = new Set(prefs.hidden);
  return orderedGroups(prefs).map((group) => ({
    ...group,
    items: orderedGroupItems(group.key, prefs).filter((i) => !hidden.has(i.path) && canOpen(menuItemSection(i))),
  })).filter((g) => g.items.length > 0);
}
