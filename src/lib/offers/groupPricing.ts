import { allocatePackPrice, nxmUnitPrice, type PricingPromotion } from "@/lib/offers/pricing";

export interface GroupPlanLine {
  productId: string;
  unitQuantity: number;
  listUnitPrice: number;
  unitPrice: number;
}

export type GroupPlanResult =
  | { ok: true; data: GroupPlanLine[] }
  | { ok: false; error: { code: "not_found" | "validation"; message: string } };

function fail(code: "not_found" | "validation", message: string): GroupPlanResult {
  return { ok: false, error: { code, message } };
}

/** Pure plan for one NxM or bundle unit, shared by storefront and onsite carts. */
export function planPromotionGroup(
  promotion: PricingPromotion,
  listPrices: Map<string, number>,
  chosenProductId?: string | null,
): GroupPlanResult {
  if (promotion.type === "nxm") {
    const eligible = [...new Set(promotion.product_ids ?? [])];
    const productId = chosenProductId && eligible.includes(chosenProductId)
      ? chosenProductId
      : eligible.length === 1 ? eligible[0] : null;
    if (!productId) return fail("validation", "Elige el producto de la promoción.");
    const buy = Number(promotion.buy_quantity ?? 0);
    const pay = Number(promotion.pay_quantity ?? 0);
    const listUnitPrice = listPrices.get(productId);
    if (listUnitPrice === undefined) return fail("not_found", "El producto de esta promoción ya no está disponible.");
    if (buy <= 0 || pay <= 0 || pay >= buy) return fail("validation", "La promoción NxM no tiene cantidades válidas.");
    return {
      ok: true,
      data: [{ productId, unitQuantity: buy, listUnitPrice, unitPrice: nxmUnitPrice(listUnitPrice, buy, pay) }],
    };
  }

  const saved = promotion.promotion_items ?? [];
  const legacy = [...new Set([...(promotion.product_ids ?? []), ...(promotion.bundle_product_ids ?? [])])];
  const packLines = saved.length > 0
    ? saved.map((item) => ({ productId: item.product_id, unitQuantity: Number(item.quantity) }))
    : legacy.map((productId) => ({
        productId,
        unitQuantity: legacy.length === 1 ? Math.max(1, Number(promotion.quantity ?? 1)) : 1,
      }));
  if (packLines.length === 0) return fail("validation", "Esta promoción no tiene productos.");
  if (packLines.some((line) => !listPrices.has(line.productId))) {
    return fail("not_found", "Un producto de este paquete ya no está disponible.");
  }
  const prices = allocatePackPrice(
    packLines.map((line) => ({
      key: line.productId,
      listUnitPrice: listPrices.get(line.productId) ?? 0,
      quantity: line.unitQuantity,
    })),
    Number(promotion.value),
  );
  return {
    ok: true,
    data: packLines.map((line) => ({
      productId: line.productId,
      unitQuantity: line.unitQuantity,
      listUnitPrice: listPrices.get(line.productId) ?? 0,
      unitPrice: prices.get(line.productId) ?? 0,
    })),
  };
}
