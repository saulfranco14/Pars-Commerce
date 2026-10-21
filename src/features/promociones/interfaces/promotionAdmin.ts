export type PromotionStatusValue = "draft" | "active" | "paused" | "archived";

export interface PromotionPackItemInput {
  product_id?: string;
  quantity?: number;
}

/** Body accepted by POST/PATCH /api/promotions (fields are optional on PATCH). */
export interface PromotionWriteInput {
  name?: string;
  slug?: string | null;
  type?: string;
  value?: number;
  min_amount?: number | null;
  product_ids?: string[] | null;
  subcatalog_ids?: string[] | null;
  bundle_product_ids?: string[] | null;
  applies_to?: string | null;
  quantity?: number | null;
  buy_quantity?: number | null;
  pay_quantity?: number | null;
  valid_from?: string | null;
  valid_until?: string | null;
  image_url?: string | null;
  description?: string | null;
  badge_label?: string | null;
  status?: string;
  template_key?: string | null;
  items?: PromotionPackItemInput[] | null;
}

export interface NormalizedPromotion {
  fields: Record<string, unknown>;
  /** null = leave pack items untouched; array = replace them. */
  items: Array<{ product_id: string; quantity: number }> | null;
}
