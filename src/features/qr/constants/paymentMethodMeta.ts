import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";

export interface PaymentMethodMeta {
  /** Short label shown in headers and chips. */
  label: string;
  /** Slightly longer label used in customer-facing pickers. */
  pickerLabel: string;
  /** One-line description for the method picker. */
  description: string;
  icon: LucideIcon;
  /** Tailwind text class for the icon when displayed in a colored chip. */
  color: string;
  /** Tailwind background class for the colored chip surrounding the icon. */
  bg: string;
}

export const PAYMENT_METHOD_META: Record<CustomerPayMethod, PaymentMethodMeta> =
  {
    mercadopago: {
      label: "Mercado Pago",
      pickerLabel: "Mercado Pago",
      description: "Tarjeta, débito o SPEI desde la app",
      icon: Smartphone,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    transferencia: {
      label: "Transferencia",
      pickerLabel: "Transferencia bancaria",
      description: "Te mostramos los datos de la cuenta",
      icon: Building2,
      color: "text-violet-700",
      bg: "bg-violet-100",
    },
    tarjeta: {
      label: "Tarjeta",
      pickerLabel: "Tarjeta",
      description: "El personal te cobra con terminal",
      icon: CreditCard,
      color: "text-blue-700",
      bg: "bg-blue-100",
    },
    efectivo: {
      label: "Efectivo",
      pickerLabel: "Efectivo",
      description: "Paga en caja al terminar",
      icon: Banknote,
      color: "text-emerald-700",
      bg: "bg-emerald-100",
    },
  };

/** Ordered list for use in pickers — preserves intentional display order. */
export const PAYMENT_METHOD_ORDER: CustomerPayMethod[] = [
  "mercadopago",
  "transferencia",
  "tarjeta",
  "efectivo",
];
