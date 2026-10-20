"use client";

import { useMemo, useState } from "react";

import { catalogItemKey } from "@/features/solutions/helpers/solutionFormat";
import { trackSolutionEvent } from "@/features/solutions/helpers/trackSolutionEvent";

import type { CatalogItemDefinition } from "@/features/catalog/catalogDefinitions";
import type { SolutionDefinition } from "@/features/solutions/solutionCatalog";
import type {
  CartLine,
  Journey,
  OrderStage,
  PaymentMethod,
} from "@/features/solutions/interfaces/solutionExperience";

/** The simulated sale: customer buys → business works the order → it gets charged. */
export function useSolutionJourney(solution: SolutionDefinition) {
  const allItems = useMemo(
    () => [...solution.catalog.products, ...solution.catalog.services],
    [solution.catalog.products, solution.catalog.services],
  );
  const featuredItems = allItems.slice(0, 2);
  const firstItem = featuredItems[0];
  const starterCart = (): Record<string, number> =>
    firstItem ? { [catalogItemKey(firstItem)]: 1 } : {};

  const [journey, setJourney] = useState<Journey>("customer");
  const [stage, setStage] = useState<OrderStage>("shopping");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("En línea");
  const [cart, setCart] = useState<Record<string, number>>(starterCart);

  const cartLines: CartLine[] = allItems.flatMap((item) => {
    const quantity = cart[catalogItemKey(item)] ?? 0;
    return quantity > 0 ? [{ item, quantity }] : [];
  });
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0);
  const total = cartLines.reduce((sum, line) => sum + line.item.price * line.quantity, 0);

  function quantityOf(item: CatalogItemDefinition): number {
    return cart[catalogItemKey(item)] ?? 0;
  }

  function changeQuantity(item: CatalogItemDefinition, delta: number) {
    const key = catalogItemKey(item);
    setCart((current) => ({ ...current, [key]: Math.max(0, (current[key] ?? 0) + delta) }));
    if (delta > 0) trackSolutionEvent("solution_catalog_item_added", { solution: solution.path, item: item.name });
  }

  function goToJourney(next: Journey) {
    // Keeps a sample item so any step can be explored without a $0 charge.
    if (next !== "customer" && cartCount === 0) setCart(starterCart());
    setJourney(next);
    if (next === "orders" && stage === "shopping") setStage("received");
    if (next === "checkout" && stage !== "paid") setStage("ready");
    trackSolutionEvent("solution_journey_viewed", { solution: solution.path, view: next });
  }

  function submitOrder() {
    if (!cartCount) return;
    setStage("received");
    setJourney("orders");
    trackSolutionEvent("solution_order_submitted", { solution: solution.path, items: cartCount, total });
  }

  function advanceOrder() {
    if (stage === "received") setStage("preparing");
    if (stage === "preparing") setStage("ready");
    if (stage === "ready") setJourney("checkout");
    trackSolutionEvent("solution_order_progressed", { solution: solution.path, from: stage });
  }

  function chargeOrder() {
    setStage("paid");
    trackSolutionEvent("solution_checkout_completed", { solution: solution.path, payment_method: paymentMethod, total });
  }

  function resetJourney() {
    setCart(starterCart());
    setStage("shopping");
    setJourney("customer");
  }

  return {
    featuredItems,
    journey,
    stage,
    paymentMethod,
    setPaymentMethod,
    cartLines,
    cartCount,
    total,
    quantityOf,
    changeQuantity,
    goToJourney,
    submitOrder,
    advanceOrder,
    chargeOrder,
    resetJourney,
  };
}
