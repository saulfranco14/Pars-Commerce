import type { PromotionForPrice } from "@/lib/promotionPrice";

import type { ActivePromotion } from "@/features/sitio/interfaces/storefront";

const ADDABLE_PROMOTION_TYPES = new Set([
  "percentage",
  "fixed_amount",
  "bundle_price",
  "fixed_price",
]);

export function isPromotionActive(
  promotion: { valid_from?: string | null; valid_until?: string | null },
  now: Date = new Date(),
): boolean {
  const from = promotion.valid_from ? new Date(promotion.valid_from) : null;
  const until = promotion.valid_until ? new Date(promotion.valid_until) : null;
  if (from && from > now) return false;
  if (until && until < now) return false;
  return true;
}

export function toPromotionsForPrice(promotions: ActivePromotion[]): PromotionForPrice[] {
  return promotions.map((promotion) => ({
    id: promotion.id,
    type: promotion.type,
    value: Number(promotion.value),
    quantity: promotion.quantity,
    product_ids: promotion.product_ids,
    bundle_product_ids: promotion.bundle_product_ids,
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
  const value = Number(promotion.value);
  const money = `$${value.toFixed(2)}`;
  switch (promotion.type) {
    case "percentage":
      return `${value}% de descuento`;
    case "fixed_amount":
      return `${money} de descuento`;
    case "bundle_price":
      return promotion.quantity ? `${promotion.quantity} por ${money}` : money;
    case "fixed_price":
      return `Precio especial ${money}`;
    case "event_badge":
      return promotion.badge_label || "Promoción";
    default:
      return money;
  }
}

export function formatPromotionDeadline(validUntil: string | null): string | null {
  if (!validUntil) return null;
  return new Date(validUntil).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
  });
}
