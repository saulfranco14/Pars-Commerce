import type { PromotionMechanic, ValidityPreset } from "@/features/promociones/interfaces/offerTemplate";

export type OfferWizardStep = "plantilla" | "mecanica" | "productos" | "detalles" | "revisar";

export interface PackItemValue {
  product_id: string;
  quantity: number;
}

export interface OfferWizardValues {
  templateKey: string | null;
  mechanic: PromotionMechanic;
  appliesToAll: boolean;
  productIds: string[];
  subcatalogIds: string[];
  packItems: PackItemValue[];
  value: string;
  buyQuantity: number;
  payQuantity: number;
  badgeLabel: string;
  validity: ValidityPreset;
  validFrom: string;
  validUntil: string;
  name: string;
  description: string;
  imageUrl: string;
}

/** Catalog item as the picker needs it (from GET /api/products). */
export interface PickerItem {
  id: string;
  name: string;
  price: number;
  type: "product" | "service" | string;
  image_url: string | null;
  subcatalog_id: string | null;
  is_public: boolean;
}

export interface PickerSubcatalog {
  id: string;
  name: string;
}

/** A promotion as GET /api/promotions?promotion_id returns it, for editing. */
export interface EditablePromotion {
  id: string;
  name: string;
  type: string;
  value: number;
  status: string;
  applies_to: string | null;
  template_key: string | null;
  product_ids: string[] | null;
  subcatalog_ids: string[] | null;
  bundle_product_ids: string[] | null;
  buy_quantity: number | null;
  pay_quantity: number | null;
  badge_label: string | null;
  valid_from: string | null;
  valid_until: string | null;
  description: string | null;
  image_url: string | null;
  promotion_items?: Array<{ product_id: string; quantity: number; position: number | null }> | null;
}
