import { apiFetch } from "@/services/apiFetch";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

export interface CounterPaymentResponse {
  success: true;
  paymentId: string;
  amount: number;
  allPaid: boolean;
}

/** El mostrador recibió el dinero de un pedido que el cliente no escaneó. */
export async function chargeOrderAtCounter(
  orderId: string,
  method: IntentMethod,
): Promise<CounterPaymentResponse> {
  return (await apiFetch(`/api/orders/${orderId}/counter-payment`, {
    method: "POST",
    body: JSON.stringify({ method }),
  })) as CounterPaymentResponse;
}
