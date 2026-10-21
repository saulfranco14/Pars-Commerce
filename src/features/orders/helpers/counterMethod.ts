import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

const BY_ORDER_METHOD: Record<string, IntentMethod> = {
  cash: "efectivo",
  efectivo: "efectivo",
  bank_transfer: "transferencia",
  transferencia: "transferencia",
  card: "tarjeta",
  tarjeta: "tarjeta",
};

/** The counter method the customer already chose at checkout, if it is one the counter can take. */
export function counterMethodFor(orderPaymentMethod: string | null | undefined): IntentMethod | null {
  return orderPaymentMethod ? BY_ORDER_METHOD[orderPaymentMethod.trim().toLowerCase()] ?? null : null;
}
