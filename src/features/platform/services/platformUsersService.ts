import type { SupabaseClient } from "@supabase/supabase-js";

import type { PlatformUser, PlatformUsersResponse, UserFilters, UserSort } from "@/features/platform/types";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

const STATUSES = ["active", "pending", "suspended"];
const ACTIVATIONS = ["sin_negocio", "registrado", "tienda_lista", "cobros", "primera_venta", "activo", "sin_mp"];
const ORIGINS = ["engine", "assisted", "self"];
const SORTS: UserSort[] = ["created_at", "last_sign_in_at", "name", "email", "activation"];

/** Only known values reach SQL; everything else is ignored. */
export function parseUserQuery(params: URLSearchParams): { filters: UserFilters; sort: UserSort; desc: boolean; page: number; perPage: number } {
  const pick = (key: string, allowed: string[]) => (allowed.includes(params.get(key) ?? "") ? (params.get(key) as string) : undefined);
  const idle = Number(params.get("idle_days"));
  return {
    filters: {
      q: params.get("q")?.trim().slice(0, 80) || undefined,
      status: pick("status", STATUSES) as UserFilters["status"],
      activation: pick("activation", ACTIVATIONS) as UserFilters["activation"],
      mp: pick("mp", ["connected", "not"]) as UserFilters["mp"],
      origin: pick("origin", ORIGINS) as UserFilters["origin"],
      plan: params.get("plan")?.slice(0, 20) || undefined,
      idle_days: Number.isInteger(idle) && idle > 0 && idle <= 365 ? idle : undefined,
    },
    sort: (SORTS.find((sort) => sort === params.get("sort")) ?? "created_at") as UserSort,
    desc: params.get("dir") !== "asc",
    page: Math.max(Number(params.get("page")) || 1, 1),
    perPage: Math.min(Math.max(Number(params.get("per_page")) || 25, 5), 100),
  };
}

export async function listPlatformUsers(
  admin: SupabaseClient,
  viewerId: string,
  query: { filters: UserFilters; sort: UserSort; desc: boolean; page: number; perPage: number },
): Promise<ServiceResult<PlatformUsersResponse>> {
  const { data, error } = await admin.rpc("platform_users_overview" as never, {
    p_filters: Object.fromEntries(Object.entries(query.filters).filter(([, value]) => value !== undefined)),
    p_sort: query.sort,
    p_desc: query.desc,
    p_page: query.page,
    p_per_page: query.perPage,
  } as never);
  if (error) return { ok: false, error: { code: "internal", message: (error as { message: string }).message } };
  const result = data as unknown as { total: number; stats: PlatformUsersResponse["stats"]; rows: Array<Omit<PlatformUser, "is_self" | "businesses" | "active_businesses">> };
  const users: PlatformUser[] = result.rows.map((row) => ({
    ...row,
    is_self: row.id === viewerId,
    businesses: row.memberships.length,
    active_businesses: row.memberships.filter((membership) => membership.status !== "suspended" && membership.status !== "invited").length,
  }));
  return {
    ok: true,
    data: {
      users,
      total: result.total,
      page: query.page,
      per_page: query.perPage,
      total_pages: Math.max(Math.ceil(result.total / query.perPage), 1),
      stats: result.stats,
    },
  };
}

const ACTIVATION_LABEL: Record<string, string> = {
  sin_negocio: "Sin negocio",
  registrado: "Registrado",
  tienda_lista: "Tienda lista",
  cobros: "Cobros conectados",
  primera_venta: "Primera venta",
  activo: "Activo",
};

function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The filtered list as CSV, with the columns the table shows. */
export function usersCsv(users: PlatformUser[]): string {
  const header = ["Nombre", "Correo", "Teléfono", "Estado", "Negocio", "Activación", "Mercado Pago", "Plan", "Origen", "Lo trajo", "Alta", "Último acceso"];
  const rows = users.map((user) => [
    user.display_name, user.email, user.phone, user.status, user.tenant?.name, ACTIVATION_LABEL[user.activation] ?? user.activation,
    user.mp_connected ? "Conectado" : "No", user.plan, user.origin, user.acquired_by_name, user.created_at?.slice(0, 10), user.last_sign_in_at?.slice(0, 10),
  ].map(cell).join(","));
  return [header.join(","), ...rows].join("\n");
}
