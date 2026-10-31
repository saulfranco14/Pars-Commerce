export interface OverviewPoint {
  day: string;
  value: number;
}

export interface OverviewTopStore {
  tenant_id: string;
  name: string;
  slug: string;
  visits: number;
  orders: number;
  mp_connected: boolean;
}

/** platform_overview: how the platform is doing, without settlements. */
export interface PlatformOverview {
  days: number;
  registrations: number;
  registrations_prev: number;
  registrations_by_day: OverviewPoint[];
  tenants: number;
  stores_published: number;
  mp_connected: number;
  orders: number;
  sales: number;
  visits: number;
  visitors: number;
  visits_by_day: OverviewPoint[];
  active_users_7d: number;
  funnel: { registered: number; store_ready: number; mp_connected: number; first_sale: number; active: number };
  top_stores: OverviewTopStore[];
  alerts: { mp_problem: number; published_without_products: number; open_settlements: number };
  by_acquisition: Record<string, number>;
}

export interface OperationHealth {
  open_orders: number;
  stale_tables: Array<{ id: string }>;
  errors_last_24h: number;
}

export interface OverviewChartProps {
  title: string;
  description: string;
  data: OverviewPoint[];
  kind: "line" | "bar";
  valueLabel: string;
}
