import { formatOfferLabel } from "@/lib/offers/formatOfferLabel";

import type { PromotionCollageLabel } from "@/features/promociones/interfaces/promotionVisual";

export const COLLAGE_MAX_IMAGES = 3;

const KICKERS: Record<string, string> = {
  bundle_price: "Combo",
  nxm: "Promoción",
  percentage: "Descuento",
  fixed_amount: "Descuento",
  fixed_price: "Precio especial",
  event_badge: "Temporada",
};

/** Small line on top ("Combo") and the deal itself ("Paquete en $199.00"). */
export function promotionCollageLabel(promotion: Parameters<typeof formatOfferLabel>[0] & { badge_label?: string | null }): PromotionCollageLabel {
  return {
    kicker: promotion.type === "event_badge" ? "Temporada" : KICKERS[promotion.type] ?? "Promoción",
    label: formatOfferLabel(promotion),
  };
}

/** First distinct photos of the promotion's products, pack items first. */
export function collageImages(productIds: readonly string[], imageOf: (productId: string) => string | null | undefined): string[] {
  const images: string[] = [];
  for (const id of productIds) {
    const url = imageOf(id);
    if (url && !images.includes(url)) images.push(url);
    if (images.length === COLLAGE_MAX_IMAGES) break;
  }
  return images;
}
