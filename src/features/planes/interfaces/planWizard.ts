import type { IntervalUnit } from "@/lib/offers/planPeriods";

export type PlanWizardStep = "plantilla" | "incluye" | "precio" | "entrega" | "presentacion" | "revisar";

export interface PlanItemValue {
  product_id: string;
  quantity: number;
}

export interface PlanWizardValues {
  templateKey: string | null;
  items: PlanItemValue[];
  price: string;
  intervalUnit: IntervalUnit;
  intervalCount: number;
  /** null = until the customer cancels. */
  maxPeriods: number | null;
  fulfillmentMethods: Array<"pickup" | "delivery">;
  /** Index of Date#getDay(); null = no fixed day. */
  preferredWeekday: number | null;
  renewalLeadDays: number;
  graceDays: number;
  /** "" = no limit. */
  maxActiveMembers: string;
  name: string;
  description: string;
  imageUrl: string;
}
