/**
 * Minimal promotion shape surfaced to the customer QR flow. A trimmed view of
 * the full `Promotion` (src/services/promotionsService.ts) — only what the
 * PromoBanner renders, so the public payload stays lean.
 */
export interface QrPromotion {
  id: string;
  name: string;
  type: string;
  value: number;
  badge_label: string | null;
  image_url: string | null;
  description: string | null;
  valid_until: string | null;
}
