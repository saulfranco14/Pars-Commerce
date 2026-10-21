import { addInterval, formatInterval } from "@/lib/offers/planPeriods";
import { roundMoney } from "@/lib/offers/pricing";

import { WEEKDAY_LABELS } from "@/features/planes/constants/planOptions";

import type { PublicOfferPlan } from "@/features/planes/interfaces/offerPlan";

type PlanLike = Pick<PublicOfferPlan, "interval_unit" | "interval_count">;

/** "mes", "2 semanas" — the word after "/" and "cada". */
export function planEvery(plan: PlanLike): string {
  return formatInterval({ unit: plan.interval_unit, count: plan.interval_count });
}

export function planSavings(plan: Pick<PublicOfferPlan, "price" | "list_value">): number {
  return Math.max(0, roundMoney(plan.list_value - plan.price));
}

/** "los sábados", "los lunes": weekdays ending in -s don't change. */
export function weekdayPlural(index: number): string {
  const day = WEEKDAY_LABELS[index].toLowerCase();
  return `los ${day.endsWith("s") ? day : `${day}s`}`;
}

/** Short facts shown under a plan: how it arrives, on which day, for how long. */
export function planFacts(plan: Pick<PublicOfferPlan, "fulfillment_methods" | "preferred_weekday" | "max_periods">): string[] {
  const facts: string[] = [];
  const pickup = plan.fulfillment_methods.includes("pickup");
  const delivery = plan.fulfillment_methods.includes("delivery");
  if (pickup && delivery) facts.push("A domicilio o para recoger");
  else if (delivery) facts.push("Entrega a domicilio");
  else if (pickup) facts.push("Listo para recoger");
  if (plan.preferred_weekday !== null) facts.push(`Entrega ${weekdayPlural(plan.preferred_weekday)}`);
  facts.push(plan.max_periods ? `${plan.max_periods} periodos` : "Cancela cuando quieras");
  return facts;
}

/** When the second period would be charged if the first is paid today. */
export function nextChargeDate(plan: PlanLike, from: Date = new Date()): Date {
  return addInterval(from, { unit: plan.interval_unit, count: plan.interval_count });
}

export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { day: "numeric", month: "short", timeZone: "America/Mexico_City" });
}
