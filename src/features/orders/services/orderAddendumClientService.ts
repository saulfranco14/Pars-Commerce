import { apiFetch } from "@/services/apiFetch";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

export interface AddendumResponse {
  success: true;
  order_id: string;
  parent_order_id: string;
  total: number;
}

/** Crea el pedido complementario de uno ya pagado. */
export async function createAddendum(
  parentOrderId: string,
  items: RequestedItem[],
  reason?: string,
): Promise<AddendumResponse> {
  return (await apiFetch("/api/orders/addendum", {
    method: "POST",
    body: JSON.stringify({
      parent_order_id: parentOrderId,
      items,
      reason: reason?.trim() || undefined,
    }),
  })) as AddendumResponse;
}
