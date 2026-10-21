import type { PlanBillingMethod, PlanFulfillmentMethod } from "@/features/planes/interfaces/offerPlan";
import type { PlanInterval } from "@/lib/offers/planPeriods";

export const PLAN_STATUSES = ["draft", "active", "paused", "archived"] as const;
export const PLAN_KINDS = ["subscription", "membership"] as const;
export const PLAN_BILLING_METHODS = ["manual", "mp_auto"] as const;
export const PLAN_FULFILLMENT_METHODS = ["pickup", "delivery", "in_store"] as const;
export const MAX_PLAN_PRICE = 100_000;

export const INTERVAL_PRESETS: ReadonlyArray<{ label: string; interval: PlanInterval }> = [
  { label: "Cada semana", interval: { unit: "week", count: 1 } },
  { label: "Cada 2 semanas", interval: { unit: "week", count: 2 } },
  { label: "Cada mes", interval: { unit: "month", count: 1 } },
  { label: "Cada 2 meses", interval: { unit: "month", count: 2 } },
  { label: "Cada 3 meses", interval: { unit: "month", count: 3 } },
];

export const DURATION_PRESETS: ReadonlyArray<{ label: string; value: number | null }> = [
  { label: "Hasta que cancele", value: null },
  { label: "3 periodos", value: 3 },
  { label: "6 periodos", value: 6 },
  { label: "12 periodos", value: 12 },
];

/** Index = Date#getDay(). */
export const WEEKDAY_LABELS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"] as const;

export const FULFILLMENT_LABELS: Record<PlanFulfillmentMethod, string> = {
  pickup: "Recoger en el negocio",
  delivery: "Entrega a domicilio",
  in_store: "En el negocio",
};

export const BILLING_LABELS: Record<PlanBillingMethod, { title: string; description: string }> = {
  manual: {
    title: "Pago cada periodo",
    description: "Antes de cada periodo se genera su pedido; el cliente paga por transferencia, en efectivo o en caja.",
  },
  mp_auto: {
    title: "Cobro automático con tarjeta",
    description: "Mercado Pago cobra solo cada periodo. Disponible pronto.",
  },
};
