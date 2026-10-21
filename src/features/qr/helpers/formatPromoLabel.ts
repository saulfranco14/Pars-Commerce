import { formatOfferLabel, type OfferLabelShape } from "@/lib/offers/formatOfferLabel";

/** QR banner label; same wording as the storefront and the dashboard. */
export function formatPromoLabel(promotion: OfferLabelShape): string {
  return formatOfferLabel(promotion);
}
