import { formatOfferDeadline, formatOfferLabel } from "@/lib/offers/formatOfferLabel";
import { isPromotionLive } from "@/lib/offers/pricing";
import type { PromotionForPrice } from "@/lib/promotionPrice";

import type { ActivePromotion } from "@/features/sitio/interfaces/storefront";

const ADDABLE_PROMOTION_TYPES = new Set([
  "percentage",
  "fixed_amount",
  "bundle_price",
  "fixed_price",
  "nxm",
]);

export function isPromotionActive(
  promotion: { status?: string | null; valid_from?: string | null; valid_until?: string | null },
  now: Date = new Date(),
): boolean {
  return isPromotionLive(promotion, now);
}

export function toPromotionsForPrice(promotions: ActivePromotion[]): PromotionForPrice[] {
  return promotions.map((promotion) => ({
    id: promotion.id,
    type: promotion.type,
    value: Number(promotion.value),
    quantity: promotion.quantity,
    product_ids: promotion.product_ids,
    bundle_product_ids: promotion.bundle_product_ids,
    subcatalog_ids: promotion.subcatalog_ids ?? null,
    applies_to: promotion.applies_to ?? null,
    status: promotion.status ?? null,
    valid_from: promotion.valid_from,
    valid_until: promotion.valid_until,
    badge_label: promotion.badge_label,
  }));
}

export function promotionProductIds(promotion: ActivePromotion): string[] {
  return [
    ...(promotion.product_ids ?? []),
    ...(promotion.bundle_product_ids ?? []),
  ].filter(Boolean);
}

/** A promotion can go straight to the cart only when it names concrete items. */
export function isPromotionAddable(promotion: ActivePromotion): boolean {
  return (
    promotionProductIds(promotion).length > 0 &&
    ADDABLE_PROMOTION_TYPES.has(promotion.type)
  );
}

export function formatPromotionValue(promotion: ActivePromotion): string {
  return formatOfferLabel(promotion);
}

export function formatPromotionDeadline(validUntil: string | null): string | null {
  return formatOfferDeadline(validUntil);
}
