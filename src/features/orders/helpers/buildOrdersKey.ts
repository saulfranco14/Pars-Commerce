import type { OrdersQuery } from "@/features/orders/interfaces/ordersQuery";

/**
 * Clave SWR de la lista de pedidos. Es un objeto y no cinco argumentos
 * posicionales porque `buildOrdersKey(id, "", "", "", "mine")` no dice nada en
 * el sitio donde se llama.
 */
export function buildOrdersKey({
  tenantId,
  status,
  dateFrom,
  dateTo,
  scope,
}: OrdersQuery): string | null {
  if (!tenantId) return null;
  const search = new URLSearchParams({ tenant_id: tenantId });
  if (status) search.set("status", status);
  if (dateFrom) search.set("date_from", dateFrom);
  if (dateTo) search.set("date_to", dateTo);
  // "all" es el valor por omisión del servidor; omitirlo mantiene la clave
  // estable y evita una recarga solo por cambiar la URL.
  if (scope === "mine") search.set("scope", "mine");
  return `/api/orders?${search}`;
}
