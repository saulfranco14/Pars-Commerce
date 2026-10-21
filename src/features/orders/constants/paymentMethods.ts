import { Banknote, Building2, CreditCard, Smartphone } from "lucide-react";

export const PAYMENT_METHODS = [
  {
    id: "efectivo",
    label: "EFECTIVO",
    icon: Banknote,
    colorClass: "text-emerald-600",
  },
  {
    id: "transferencia",
    label: "TRANSFERENCIA",
    icon: Building2,
    colorClass: "text-violet-600",
  },
  {
    id: "tarjeta",
    label: "TARJETA",
    icon: CreditCard,
    colorClass: "text-blue-600",
  },
  {
    id: "mercadopago",
    label: "MERCADO PAGO",
    icon: Smartphone,
    colorClass: "text-blue-600",
  },
] as const;

export type PaymentMethodId = (typeof PAYMENT_METHODS)[number]["id"];

/** What the counter can receive in hand; Mercado Pago is paid by the customer on their phone. */
export const COUNTER_PAYMENT_METHODS = PAYMENT_METHODS.filter((method) => method.id !== "mercadopago") as ReadonlyArray<
  (typeof PAYMENT_METHODS)[number] & { id: "efectivo" | "transferencia" | "tarjeta" }
>;

/** "EFECTIVO" → "Efectivo". */
export function paymentMethodLabel(label: string): string {
  return label.charAt(0) + label.slice(1).toLowerCase();
}
