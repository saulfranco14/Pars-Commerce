import { apiFetch } from "@/services/apiFetch";

import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

/** Avanza el trabajo de un pedido: recibido → en proceso → listo. */
export async function advanceOrderFulfillment(
  orderId: string,
  status: FulfillmentStatus,
): Promise<void> {
  await apiFetch(`/api/qr/table/${orderId}/fulfillment`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
}
