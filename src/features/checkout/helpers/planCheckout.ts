import { roundMoney } from "@/lib/offers/pricing";

import type { CartPlanLine } from "@/types/cart";
import type { CheckoutFulfillmentMethod, CheckoutMode } from "@/features/checkout/interfaces/publicCheckout";

/** Why a cart with plans cannot be paid this way, or null when it can. */
export function planCheckoutProblem(
  plans: CartPlanLine[],
  options: { mode: CheckoutMode; fulfillmentMethod: CheckoutFulfillmentMethod },
): string | null {
  if (plans.length === 0) return null;
  if (options.mode !== "single") return "Las suscripciones se pagan en un solo pago; el siguiente periodo se cobra aparte.";
  const unavailable = plans.find((line) => !line.plan.fulfillment_methods.includes(options.fulfillmentMethod));
  if (unavailable) {
    return options.fulfillmentMethod === "delivery"
      ? `"${unavailable.plan.name}" no tiene entrega a domicilio. Elige recoger.`
      : `"${unavailable.plan.name}" sólo se entrega a domicilio.`;
  }
  return null;
}

export function plansTotal(plans: CartPlanLine[]): number {
  return roundMoney(plans.reduce((sum, line) => sum + line.price_snapshot, 0));
}

/** Mercado Pago line for each plan's first period; the business absorbs fees, prices are not inflated. */
export function planChargeItems(plans: CartPlanLine[]) {
  return plans.map((line) => ({
    id: `plan-${line.offer_plan_id}`,
    title: `${line.plan.name} · primer periodo`,
    quantity: 1,
    unit_price: line.price_snapshot,
    currency_id: "MXN" as const,
  }));
}

/** A plan that is only picked up (or only delivered) narrows the checkout's options. */
export function restrictCheckoutForPlans<T extends { deliveryEnabled: boolean; pickupEnabled: boolean }>(options: T, plans: CartPlanLine[]): T {
  if (plans.length === 0) return options;
  return {
    ...options,
    deliveryEnabled: options.deliveryEnabled && plans.every((line) => line.plan.fulfillment_methods.includes("delivery")),
    pickupEnabled: options.pickupEnabled && plans.every((line) => line.plan.fulfillment_methods.includes("pickup")),
  };
}

/** Moves a selection off a fulfillment method the options no longer allow. */
export function fitSelectionToOptions<S extends { fulfillment: CheckoutFulfillmentMethod }>(
  selection: S,
  options: { deliveryEnabled: boolean; pickupEnabled: boolean },
): S {
  if (selection.fulfillment === "delivery" && !options.deliveryEnabled && options.pickupEnabled) return { ...selection, fulfillment: "pickup" };
  if (selection.fulfillment === "pickup" && !options.pickupEnabled && options.deliveryEnabled) return { ...selection, fulfillment: "delivery" };
  return selection;
}
