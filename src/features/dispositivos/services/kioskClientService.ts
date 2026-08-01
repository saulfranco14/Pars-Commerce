import { apiFetch } from "@/services/apiFetch";

import type { RequestedItem } from "@/features/qr/helpers/buildOrderItemRows";

export interface KioskOrderResponse {
  success: true;
  order_id: string;
  qr_token: string;
  order_number: string;
  total: number;
}

export async function createKioskOrder(
  items: RequestedItem[],
  scheduledFor: string | null,
): Promise<KioskOrderResponse> {
  return (await apiFetch("/api/kiosk/order", {
    method: "POST",
    body: JSON.stringify({ items, scheduled_for: scheduledFor }),
  })) as KioskOrderResponse;
}
