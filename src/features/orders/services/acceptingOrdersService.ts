import { apiFetch } from "@/services/apiFetch";

/** Abre o cierra la recepción de pedidos del sitio público del negocio. */
export async function setAcceptingOrders(
  tenantId: string,
  accepting: boolean,
): Promise<void> {
  await apiFetch("/api/tenants/accepting-orders", {
    method: "PATCH",
    body: JSON.stringify({
      tenant_id: tenantId,
      accepting_orders: accepting,
    }),
  });
}
