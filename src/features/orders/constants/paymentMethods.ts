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
