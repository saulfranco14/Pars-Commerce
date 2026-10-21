export interface CartLineRecord {
  id: string;
  cart_id: string;
  product_id: string;
  product_variant_id: string | null;
  quantity: number;
  price_snapshot: number | string;
  list_unit_price: number | string | null;
  promotion_id: string | null;
  group_id: string | null;
  group_unit_quantity: number | null;
}

export interface CartPromotionRecord {
  id: string;
  type: string;
  value: number | string;
  status: string | null;
  applies_to: string | null;
  quantity: number | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  product_ids: string[] | null;
  subcatalog_ids: string[] | null;
  bundle_product_ids: string[] | null;
  valid_from: string | null;
  valid_until: string | null;
  promotion_items?: Array<{ product_id: string; quantity: number; position: number | null }> | null;
}

export interface CartProductRecord {
  id: string;
  price: number | string;
  has_variants: boolean | null;
  subcatalog_id: string | null;
  is_public: boolean | null;
  deleted_at: string | null;
}

export interface AddProductLineInput {
  cartId: string;
  tenantId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
}

export interface AddPromotionGroupInput {
  cartId: string;
  tenantId: string;
  promotionId: string;
  /** Required only when an NxM promotion lists several eligible products. */
  productId?: string | null;
}

export interface CartLineChangeInput {
  cartId: string;
  itemId: string;
}

export interface SetLineQuantityInput extends CartLineChangeInput {
  quantity: number;
}

export interface RepriceResult {
  changed: boolean;
}
