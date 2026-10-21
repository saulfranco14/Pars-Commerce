import { bestUnitPromotion, type PricingPromotion } from "@/lib/offers/pricing";

export interface PromotionForPrice {
  id: string;
  type: string;
  value: number;
  quantity?: number | null;
  product_ids?: string[] | null;
  bundle_product_ids?: string[] | null;
  subcatalog_ids?: string[] | null;
  applies_to?: string | null;
  status?: string | null;
  valid_from?: string | null;
  valid_until?: string | null;
  badge_label?: string | null;
}

export interface ProductPromotionResult {
  promotionId: string;
  type: string;
  finalPrice: number;
  discountPercent?: number;
  badgeLabel?: string | null;
}

/**
 * Best unit-price promotion per product. Packs and NxM are intentionally not
 * considered: they only price items added together as a group, so a product
 * bought alone keeps its list price.
 */
export function buildProductPromoMap(
  promotions: PromotionForPrice[],
  productIds: string[],
  productPrices: Map<string, number>,
  productSubcatalogs: Map<string, string | null> = new Map(),
): Map<string, ProductPromotionResult> {
  const result = new Map<string, ProductPromotionResult>();
  const pricing = promotions as PricingPromotion[];
  for (const productId of productIds) {
    const best = bestUnitPromotion(pricing, {
      id: productId,
      price: productPrices.get(productId) ?? 0,
      subcatalog_id: productSubcatalogs.get(productId) ?? null,
    });
    if (best) result.set(productId, best);
  }
  return result;
}
