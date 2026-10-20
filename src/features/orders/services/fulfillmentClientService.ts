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

/** Avanza un solo producto del pedido; el pedido se deriva de sus productos. */
export async function advanceOrderItemFulfillment(
  orderId: string,
  orderItemId: string,
  status: FulfillmentStatus,
): Promise<void> {
  await apiFetch(`/api/qr/table/${orderId}/fulfillment`, {
    method: "POST",
    body: JSON.stringify({ status, order_item_id: orderItemId }),
  });
}

/** Mueve todos los productos del pedido al mismo paso. */
export async function advanceWholeOrderFulfillment(
  orderId: string,
  status: FulfillmentStatus,
): Promise<void> {
  await apiFetch(`/api/qr/table/${orderId}/fulfillment`, {
    method: "POST",
    body: JSON.stringify({ status, all: true }),
  });
}
