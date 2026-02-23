export interface PromotionForPrice {
  id: string;
  type: string;
  value: number;
  quantity?: number | null;
  product_ids?: string[] | null;
  bundle_product_ids?: string[] | null;
  badge_label?: string | null;
}

export interface ProductPromotionResult {
  promotionId: string;
  type: string;
  finalPrice: number;
  discountPercent?: number;
  badgeLabel?: string | null;
}

function getBundleTotalUnits(
  promo: PromotionForPrice,
  productCount: number
): number {
  const isBundle = promo.type === "bundle_price";
  const promoQty = Number(promo.quantity ?? 1);
  return isBundle && productCount === 1 ? promoQty : productCount;
}

export function calculatePromotionPrice(
  basePrice: number,
  promo: PromotionForPrice,
  productIdsInPromo: string[]
): { finalPrice: number; discountPercent?: number } {
  const promoValue = Number(promo.value);
  const bundleTotal = getBundleTotalUnits(promo, productIdsInPromo.length);

  let finalPrice: number;
  switch (promo.type) {
    case "percentage":
      finalPrice = basePrice * (1 - promoValue / 100);
      return {
        finalPrice: Math.round(finalPrice * 100) / 100,
        discountPercent: promoValue,
      };
    case "fixed_amount":
      finalPrice = Math.max(0, basePrice - promoValue);
      return { finalPrice: Math.round(finalPrice * 100) / 100 };
    case "bundle_price":
      finalPrice = promoValue / bundleTotal;
      return { finalPrice: Math.round(finalPrice * 100) / 100 };
    case "fixed_price":
      return { finalPrice: promoValue };
    default:
      return { finalPrice: basePrice };
  }
}

export function buildProductPromoMap(
  promotions: PromotionForPrice[],
  productIds: string[],
  productPrices: Map<string, number>
): Map<string, ProductPromotionResult> {
  const result = new Map<string, ProductPromotionResult>();

  for (const promo of promotions) {
    const ids = [
      ...(promo.product_ids ?? []),
      ...(promo.bundle_product_ids ?? []),
    ].filter(Boolean) as string[];
    const uniqueIds = [...new Set(ids)];

    for (const pid of uniqueIds) {
      if (!productIds.includes(pid)) continue;
      const basePrice = productPrices.get(pid) ?? 0;
      const { finalPrice, discountPercent } = calculatePromotionPrice(
        basePrice,
        promo,
        uniqueIds
      );
      const existing = result.get(pid);
      if (!existing || finalPrice < existing.finalPrice) {
        result.set(pid, {
          promotionId: promo.id,
          type: promo.type,
          finalPrice,
          discountPercent,
          badgeLabel: promo.badge_label,
        });
      }
    }
  }

  return result;
}
