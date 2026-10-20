import { Bike, ClipboardList, Inbox, PackageCheck, Wallet } from "lucide-react";

import type { LucideIcon } from "lucide-react";

export type StationKey = "mis-pedidos" | "recepcion" | "preparacion" | "entregas" | "caja";

export interface StationMeta {
  key: StationKey;
  label: string;
  /** One line under the title: what this person does here. */
  purpose: string;
  icon: LucideIcon;
  /** Holding it opens the station (aliases resolved by `roleHasPermission`). */
  permission: string;
  /** Title of its "finished today" page, when the station has one. */
  historyLabel?: string;
  /** "accordion": one column of foldable groups with one-line cards. */
  layout?: "columns" | "accordion";
}

// Order matters: it is the tab order and, for `landingSection`, who lands where.
export const STATIONS: readonly StationMeta[] = [
  {
    key: "recepcion",
    label: "Recepción",
    purpose: "Acepta los pedidos que llegan y reparte el trabajo.",
    icon: Inbox,
    permission: "orders.assign",
    layout: "accordion",
  },
  {
    key: "mis-pedidos",
    label: "Mis pedidos",
    purpose: "Los pedidos que levantaste o te asignaron, y cómo van.",
    icon: ClipboardList,
    permission: "order.take",
    layout: "accordion",
  },
  {
    key: "preparacion",
    label: "Preparación",
    purpose: "Lo que hay que preparar. Avanza cada producto o el pedido completo.",
    icon: PackageCheck,
    permission: "orders.prepare",
    historyLabel: "Preparados hoy",
    layout: "accordion",
  },
  {
    key: "entregas",
    label: "Entregas",
    purpose: "Pedidos listos para entregar a domicilio o en el local.",
    icon: Bike,
    permission: "orders.deliver",
    historyLabel: "Entregados hoy",
  },
  {
    key: "caja",
    label: "Caja",
    purpose: "Pedidos con saldo pendiente y lo cobrado hoy.",
    icon: Wallet,
    permission: "payments.write",
    layout: "accordion",
  },
];

export function stationMeta(key: string): StationMeta | null {
  return STATIONS.find((s) => s.key === key) ?? null;
}

/** Dashboard section key of a station, as `dashboardAccess` names it. */
export function stationSection(key: StationKey): string {
  return `operacion/${key}`;
}

/** Board refresh while the tab is visible; actions refresh right away. */
export const BOARD_REFRESH_MS = 60_000;
