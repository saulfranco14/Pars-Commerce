import { findTemplate } from "@/features/promociones/helpers/templateSuggestions";
import {
  fromValidityTimestamp,
  toValidityTimestamps,
  validityRange,
} from "@/features/promociones/helpers/validityPresets";

import type { PromotionMechanic } from "@/features/promociones/interfaces/offerTemplate";
import type { EditablePromotion, OfferWizardValues } from "@/features/promociones/interfaces/offerWizard";
import type { PromotionWriteInput } from "@/features/promociones/interfaces/promotionAdmin";

export const EMPTY_WIZARD_VALUES: OfferWizardValues = {
  templateKey: null,
  mechanic: "percentage",
  appliesToAll: false,
  productIds: [],
  subcatalogIds: [],
  packItems: [],
  value: "",
  buyQuantity: 2,
  payQuantity: 1,
  badgeLabel: "",
  validity: "none",
  validFrom: "",
  validUntil: "",
  name: "",
  description: "",
  imageUrl: "",
  salesChannels: ["public_store", "onsite"],
};

/** Values a template pre-fills; the merchant still picks the items. */
export function valuesFromTemplate(templateKey: string | null, today: Date = new Date()): OfferWizardValues {
  const template = findTemplate(templateKey);
  if (!template || template.kind !== "promotion" || !template.mechanic) return { ...EMPTY_WIZARD_VALUES };
  const defaults = template.defaults ?? {};
  const validity = defaults.validity ?? "none";
  const range = validityRange(validity, today);
  return {
    ...EMPTY_WIZARD_VALUES,
    templateKey: template.key,
    mechanic: template.mechanic,
    appliesToAll: defaults.appliesToAll ?? false,
    value: defaults.value !== undefined ? String(defaults.value) : "",
    buyQuantity: defaults.buyQuantity ?? 2,
    payQuantity: defaults.payQuantity ?? 1,
    badgeLabel: defaults.badgeLabel ?? "",
    validity,
    validFrom: range.from,
    validUntil: range.until,
  };
}

export function valuesFromPromotion(promotion: EditablePromotion): OfferWizardValues {
  const packItems = (promotion.promotion_items ?? [])
    .slice()
    .sort((left, right) => (left.position ?? 0) - (right.position ?? 0))
    .map((item) => ({ product_id: item.product_id, quantity: Number(item.quantity) }));
  const validFrom = fromValidityTimestamp(promotion.valid_from);
  const validUntil = fromValidityTimestamp(promotion.valid_until);
  return {
    templateKey: promotion.template_key,
    mechanic: promotion.type as PromotionMechanic,
    appliesToAll: promotion.applies_to === "all",
    productIds: promotion.product_ids ?? [],
    subcatalogIds: promotion.subcatalog_ids ?? [],
    packItems: packItems.length > 0
      ? packItems
      : (promotion.bundle_product_ids ?? []).map((product_id) => ({ product_id, quantity: 1 })),
    value: promotion.type === "nxm" || promotion.type === "event_badge" ? "" : String(Number(promotion.value)),
    buyQuantity: promotion.buy_quantity ?? 2,
    payQuantity: promotion.pay_quantity ?? 1,
    badgeLabel: promotion.badge_label ?? "",
    validity: validFrom || validUntil ? "custom" : "none",
    validFrom,
    validUntil,
    name: promotion.name,
    description: promotion.description ?? "",
    imageUrl: promotion.image_url ?? "",
    salesChannels: promotion.sales_channels?.length
      ? promotion.sales_channels
      : ["public_store", "onsite"],
  };
}

/** API body for POST/PATCH /api/promotions. */
export function toPromotionPayload(values: OfferWizardValues, status: "active" | "draft"): PromotionWriteInput {
  const mechanic = values.mechanic;
  const dates = values.validity === "none" && mechanic !== "event_badge"
    ? { valid_from: null, valid_until: null }
    : toValidityTimestamps(values.validFrom, values.validUntil);
  const unitScoped = mechanic === "percentage" || mechanic === "fixed_amount";
  const appliesTo = unitScoped && values.appliesToAll
    ? "all"
    : unitScoped && values.productIds.length === 0 && values.subcatalogIds.length > 0
      ? "subcatalogs"
      : "products";

  return {
    name: values.name.trim(),
    type: mechanic,
    value: mechanic === "nxm" || mechanic === "event_badge" ? 0 : Number(values.value),
    status,
    template_key: values.templateKey,
    applies_to: appliesTo,
    product_ids: mechanic === "bundle_price" ? [] : appliesTo === "products" ? values.productIds : [],
    subcatalog_ids: appliesTo === "subcatalogs" ? values.subcatalogIds : [],
    items: mechanic === "bundle_price" ? values.packItems : [],
    buy_quantity: mechanic === "nxm" ? values.buyQuantity : null,
    pay_quantity: mechanic === "nxm" ? values.payQuantity : null,
    badge_label: mechanic === "event_badge" ? values.badgeLabel.trim() : null,
    description: values.description.trim() || null,
    image_url: values.imageUrl.trim() || null,
    sales_channels: values.salesChannels,
    ...dates,
  };
}
