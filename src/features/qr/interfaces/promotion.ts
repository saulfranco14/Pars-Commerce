/**
 * Minimal promotion shape surfaced to the customer QR flow. A trimmed view of
 * the full admin promotion row — only what the
 * PromoBanner renders, so the public payload stays lean.
 */
export interface QrPromotion {
  id: string;
  name: string;
  type: string;
  value: number;
  badge_label: string | null;
  image_url: string | null;
  /** Product photos used for the same fallback collage shown in the storefront. */
  preview_images: string[];
  description: string | null;
  valid_until: string | null;
  valid_from: string | null;
  status: string | null;
  applies_to: string | null;
  product_ids: string[] | null;
  subcatalog_ids: string[] | null;
  bundle_product_ids: string[] | null;
  quantity: number | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  min_amount: number | null;
  sales_channels: string[];
  promotion_items: Array<{ product_id: string; quantity: number; position?: number | null }>;
}
