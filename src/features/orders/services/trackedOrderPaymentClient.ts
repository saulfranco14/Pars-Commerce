import { apiFetch } from "@/services/apiFetch";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

export async function declareOrderPayment(token: string, method: IntentMethod): Promise<void> {
  await apiFetch(`/api/public/orders/${encodeURIComponent(token)}/payment`, { method: "POST", body: JSON.stringify({ method }) });
}
