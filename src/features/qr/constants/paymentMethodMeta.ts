import {
  Banknote,
  Building2,
  CreditCard,
  Smartphone,
  type LucideIcon,
} from "lucide-react";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";

/**
 * Los campos `color` y `bg` se eliminaron: ningún componente los leía
 * (`CustomerPayModal`, `PendingPaymentsCard` y `PaymentReceipt` pintan el ícono
 * monocromo sobre un chip neutro) y documentaban una regla que la UI ya
 * contradecía. Además `mercadopago` y `tarjeta` compartían `bg-blue-100`, que
 * hoy es la banda del azul de marca: un chip de método se leería como acento.
 *
 * Un método de pago se identifica por ícono y etiqueta, no por tono. Si algún
 * día hace falta color aquí, tiene que salir de `chartColors.ts` para no tener
 * dos paletas de método de pago en el proyecto.
 */
export interface PaymentMethodMeta {
  /** Short label shown in headers and chips. */
  label: string;
  /** Slightly longer label used in customer-facing pickers. */
  pickerLabel: string;
  /** One-line description for the method picker. */
  description: string;
  icon: LucideIcon;
}

export const PAYMENT_METHOD_META: Record<CustomerPayMethod, PaymentMethodMeta> =
  {
    mercadopago: {
      label: "Mercado Pago",
      pickerLabel: "Mercado Pago",
      description: "Tarjeta, débito o SPEI desde la app",
      icon: Smartphone,
    },
    transferencia: {
      label: "Transferencia",
      pickerLabel: "Transferencia bancaria",
      description: "Te mostramos los datos de la cuenta",
      icon: Building2,
    },
    tarjeta: {
      label: "Tarjeta",
      pickerLabel: "Tarjeta",
      description: "El personal te cobra con terminal",
      icon: CreditCard,
    },
    efectivo: {
      label: "Efectivo",
      pickerLabel: "Efectivo",
      description: "Paga en caja al terminar",
      icon: Banknote,
    },
  };

/** Ordered list for use in pickers — preserves intentional display order. */
export const PAYMENT_METHOD_ORDER: CustomerPayMethod[] = [
  "mercadopago",
  "transferencia",
  "tarjeta",
  "efectivo",
];
