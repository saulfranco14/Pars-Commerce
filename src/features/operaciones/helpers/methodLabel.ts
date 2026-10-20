import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";

/** "Efectivo", "Transferencia"… for a stored payment method key. */
export function methodLabel(method: string | null): string {
  if (!method) return "Otro";
  return PAYMENT_METHOD_META[method as CustomerPayMethod]?.label ?? method;
}
