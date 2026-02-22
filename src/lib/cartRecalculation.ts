type PromotionRow = {
  id: string;
  name: string;
  type: string;
  value: number;
  quantity?: number | null;
  product_ids: string[] | null;
  bundle_product_ids: string[] | null;
  apply_automatically: boolean;
  priority: number;
  trigger_product_ids: string[] | null;
  trigger_quantity: number;
  free_quantity_per_trigger: number;
  free_quantity_max: number | null;
};

type CartItemRow = {
  id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  promotion_id: string | null;
  quantity_free: number;
};

export type RecalculatedItem = {
  id: string;
  product_id: string;
  quantity: number;
  price_snapshot: number;
  promotion_id: string | null;
  quantity_free: number;
};

function computeDiscountedPrice(
  type: string,
  basePrice: number,
  promoValue: number,
  promoQty: number,
  bundleTotalUnits: number
): number {
  switch (type) {
    case "percentage":
      return basePrice * (1 - promoValue / 100);
    case "fixed_amount":
      return Math.max(0, basePrice - promoValue);
    case "fixed_price":
      return promoValue;
    case "bundle_price":
      return promoValue / bundleTotalUnits;
    default:
      return basePrice;
  }
}

function getFreeQuantityForPromo(
  promo: PromotionRow,
  cartByProduct: Map<string, number>
): number {
  if (promo.type !== "buy_x_get_y_free") return 0;
  const triggerIds = promo.trigger_product_ids ?? [];
  const productIds = promo.product_ids ?? [];
  if (triggerIds.length === 0 || productIds.length === 0) return 0;

  let triggerUnits = 0;
  for (const pid of triggerIds) {
    triggerUnits += cartByProduct.get(pid) ?? 0;
  }
  const triggers = Math.floor(triggerUnits / (promo.trigger_quantity || 1));
  let free = triggers * (promo.free_quantity_per_trigger || 1);
  const maxFree = promo.free_quantity_max;
  if (maxFree != null) free = Math.min(free, maxFree);
  return Math.max(0, free);
}

function distributeFreeToProducts(
  freeTotal: number,
  productIds: string[],
  cartByProduct: Map<string, number>,
  alreadyAssigned: Map<string, number>
): Map<string, number> {
  const result = new Map<string, number>();
  if (productIds.length === 0 || freeTotal <= 0) return result;
  let remaining = freeTotal;
  for (const pid of productIds) {
    const inCart = cartByProduct.get(pid) ?? 0;
    const assigned = alreadyAssigned.get(pid) ?? 0;
    const canAssign = Math.min(remaining, Math.max(0, inCart - assigned));
    if (canAssign > 0) {
      result.set(pid, assigned + canAssign);
      alreadyAssigned.set(pid, assigned + canAssign);
      remaining -= canAssign;
    }
    if (remaining <= 0) break;
  }
  return result;
}

export function recalculateCart(
  items: CartItemRow[],
  promotions: PromotionRow[],
  productsMap: Map<string, number>
): RecalculatedItem[] {
  const cartByProduct = new Map<string, number>();
  for (const it of items) {
    cartByProduct.set(
      it.product_id,
      (cartByProduct.get(it.product_id) ?? 0) + it.quantity
    );
  }

  const freeByProduct = new Map<string, number>();
  const buyXGetYPromos = promotions.filter((p) => p.type === "buy_x_get_y_free");
  const alreadyAssigned = new Map<string, number>();
  for (const promo of buyXGetYPromos) {
    const totalFree = getFreeQuantityForPromo(promo, cartByProduct);
    const productIds = [...(promo.product_ids ?? [])];
    distributeFreeToProducts(
      totalFree,
      productIds,
      cartByProduct,
      alreadyAssigned
    );
  }
  for (const [pid, qty] of alreadyAssigned) {
    freeByProduct.set(pid, qty);
  }

  const applyAutoPromos = promotions.filter(
    (p) =>
      p.apply_automatically &&
      ["percentage", "fixed_amount", "fixed_price"].includes(p.type)
  );

  const result: RecalculatedItem[] = [];

  for (const item of items) {
    const pid = item.product_id;
    const qty = item.quantity;
    const basePrice = productsMap.get(pid) ?? 0;
    const freeQty = Math.min(freeByProduct.get(pid) ?? 0, qty);

    let paidQty = qty - freeQty;
    let unitPrice = basePrice;
    let bestPromoId: string | null = null;
    let bestPrice = basePrice;

    if (paidQty > 0) {
      const applicable = applyAutoPromos.filter(
        (p) =>
          (p.product_ids ?? []).includes(pid) ||
          (p.bundle_product_ids ?? []).includes(pid)
      );
      const sorted = [...applicable].sort((a, b) => a.priority - b.priority);

      for (const p of sorted) {
        const promoIds = [
          ...(p.product_ids ?? []),
          ...(p.bundle_product_ids ?? []),
        ];
        if (!promoIds.includes(pid)) continue;

        const promoVal = Number(p.value);
        const promoQty = p.quantity ?? 1;
        const bundleIds = [...new Set(promoIds)];
        const bundleUnits =
          p.type === "bundle_price" && bundleIds.length === 1
            ? promoQty
            : bundleIds.length;

        const price = computeDiscountedPrice(
          p.type,
          basePrice,
          promoVal,
          promoQty,
          bundleUnits
        );
        if (price < bestPrice && price >= 0) {
          bestPrice = price;
          bestPromoId = p.id;
        }
      }
      unitPrice = bestPrice;
    } else {
      unitPrice = 0;
    }

    const finalPrice = Math.round(unitPrice * 100) / 100;

    result.push({
      id: item.id,
      product_id: pid,
      quantity: qty,
      price_snapshot: finalPrice,
      promotion_id: bestPromoId,
      quantity_free: freeQty,
    });
  }

  return result;
}
