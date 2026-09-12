import { SERVER_SEARCH_MIN_CHARS } from "@/features/orders/constants/search";

import type { OrdersQuery } from "@/features/orders/interfaces/ordersQuery";

// An object, not five positional args: `buildOrdersKey(id, "", "", "", "mine")`
// says nothing at the call site.
export function buildOrdersKey({
  tenantId,
  status,
  dateFrom,
  dateTo,
  scope,
  search,
}: OrdersQuery): string | null {
  if (!tenantId) return null;
  const params = new URLSearchParams({ tenant_id: tenantId });
  if (status) params.set("status", status);
  if (dateFrom) params.set("date_from", dateFrom);
  if (dateTo) params.set("date_to", dateTo);
  // "all" is the server default; omitting it keeps the key stable.
  if (scope === "mine") params.set("scope", "mine");
  const term = search?.trim() ?? "";
  if (term.length >= SERVER_SEARCH_MIN_CHARS) params.set("q", term);
  return `/api/orders?${params}`;
}
