/**
 * Promotion pricing shared by the storefront, the cart and checkout. Pure: no
 * Supabase, no React, so the same numbers come out on the card, in the cart
 * and when the order is charged.
 */

export type PromotionType =
  | "percentage"
  | "fixed_amount"
  | "fixed_price"
  | "bundle_price"
  | "nxm"
  | "event_badge";

export type PromotionStatus = "draft" | "active" | "paused" | "archived";

export type PromotionAppliesTo = "products" | "subcatalogs" | "all";

export type PromotionChannel = "public_store" | "onsite";

export const DEFAULT_PROMOTION_CHANNELS: PromotionChannel[] = ["public_store", "onsite"];

/** Types that change the unit price of an item bought on its own. */
export const UNIT_PROMOTION_TYPES: ReadonlySet<string> = new Set(["percentage", "fixed_amount", "fixed_price"]);

/** Types that only apply when the whole group is bought together. */
export const GROUP_PROMOTION_TYPES: ReadonlySet<string> = new Set(["bundle_price", "nxm"]);

export const MAX_PERCENTAGE_DISCOUNT = 90;

export interface PricingPromotion {
  id: string;
  name?: string | null;
  type: string;
  value: number;
  status?: string | null;
  applies_to?: string | null;
  product_ids?: string[] | null;
  subcatalog_ids?: string[] | null;
  valid_from?: string | null;
  valid_until?: string | null;
  badge_label?: string | null;
  min_amount?: number | null;
  sales_channels?: string[] | null;
  quantity?: number | null;
  buy_quantity?: number | null;
  pay_quantity?: number | null;
  bundle_product_ids?: string[] | null;
  promotion_items?: Array<{ product_id: string; quantity: number; position?: number | null }> | null;
}

export interface PricingProduct {
  id: string;
  price: number;
  subcatalog_id?: string | null;
}

export interface UnitPromotionResult {
  promotionId: string;
  type: string;
  finalPrice: number;
  discountPercent?: number;
  badgeLabel?: string | null;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Status defaults to active so rows read before the status column existed still price. */
export function isPromotionLive(
  promotion: Pick<PricingPromotion, "status" | "valid_from" | "valid_until">,
  now: Date = new Date(),
): boolean {
  if ((promotion.status ?? "active") !== "active") return false;
  if (promotion.valid_from && new Date(promotion.valid_from) > now) return false;
  if (promotion.valid_until && new Date(promotion.valid_until) < now) return false;
  return true;
}

export function isPromotionAvailable(
  promotion: PricingPromotion,
  options: {
    channel: PromotionChannel;
    onsitePromotionsEnabled?: boolean;
    cartListSubtotal?: number;
    now?: Date;
  },
): boolean {
  if (!isPromotionLive(promotion, options.now)) return false;
  const channels = promotion.sales_channels?.length
    ? promotion.sales_channels
    : DEFAULT_PROMOTION_CHANNELS;
  if (!channels.includes(options.channel)) return false;
  if (options.channel === "onsite" && options.onsitePromotionsEnabled === false) return false;
  const minimum = Number(promotion.min_amount ?? 0);
  if (minimum > 0 && Number(options.cartListSubtotal ?? 0) < minimum) return false;
  return true;
}

export function promotionAppliesToProduct(promotion: PricingPromotion, product: PricingProduct): boolean {
  switch (promotion.applies_to ?? "products") {
    case "all":
      return true;
    case "subcatalogs":
      return Boolean(product.subcatalog_id && promotion.subcatalog_ids?.includes(product.subcatalog_id));
    default:
      return Boolean(promotion.product_ids?.includes(product.id));
  }
}

/** Unit price after a unit promotion; never negative, never above the list price. */
export function applyUnitPromotion(basePrice: number, promotion: Pick<PricingPromotion, "type" | "value">): {
  finalPrice: number;
  discountPercent?: number;
} {
  const value = Number(promotion.value);
  switch (promotion.type) {
    case "percentage": {
      const percent = Math.min(Math.max(value, 0), MAX_PERCENTAGE_DISCOUNT);
      return { finalPrice: roundMoney(basePrice * (1 - percent / 100)), discountPercent: percent };
    }
    case "fixed_amount":
      return { finalPrice: roundMoney(Math.max(0, basePrice - value)) };
    case "fixed_price":
      return { finalPrice: roundMoney(Math.min(basePrice, Math.max(0, value))) };
    default:
      return { finalPrice: basePrice };
  }
}

/** The cheapest live unit promotion for a product, or null when none lowers its price. */
export function bestUnitPromotion(
  promotions: PricingPromotion[],
  product: PricingProduct,
  now: Date = new Date(),
  options?: {
    channel?: PromotionChannel;
    onsitePromotionsEnabled?: boolean;
    cartListSubtotal?: number;
  },
): UnitPromotionResult | null {
  let best: UnitPromotionResult | null = null;
  for (const promotion of promotions) {
    if (!UNIT_PROMOTION_TYPES.has(promotion.type)) continue;
    if (options?.channel) {
      if (!isPromotionAvailable(promotion, { ...options, channel: options.channel, now })) continue;
    } else if (!isPromotionLive(promotion, now)) continue;
    if (!promotionAppliesToProduct(promotion, product)) continue;
    const { finalPrice, discountPercent } = applyUnitPromotion(product.price, promotion);
    if (finalPrice >= product.price) continue;
    if (!best || finalPrice < best.finalPrice) {
      best = {
        promotionId: promotion.id,
        type: promotion.type,
        finalPrice,
        discountPercent,
        badgeLabel: promotion.badge_label ?? null,
      };
    }
  }
  return best;
}

export interface PackLine {
  key: string;
  listUnitPrice: number;
  quantity: number;
}

/**
 * Splits a pack price across its lines in proportion to each line's list
 * value. Works in cents and rounds down, so the charged total never exceeds
 * the advertised pack price; leftover cents go to lines whose quantity
 * divides them, which makes the common cases (single units) exact.
 */
export function allocatePackPrice(lines: PackLine[], packPrice: number): Map<string, number> {
  const result = new Map<string, number>();
  const valid = lines.filter((line) => line.quantity > 0);
  if (valid.length === 0) return result;

  const packCents = Math.round(Math.max(0, packPrice) * 100);
  const listTotal = valid.reduce((sum, line) => sum + line.listUnitPrice * line.quantity, 0);
  const totalUnits = valid.reduce((sum, line) => sum + line.quantity, 0);

  const unitCents = valid.map((line) => {
    const share = listTotal > 0 ? (line.listUnitPrice * line.quantity) / listTotal : line.quantity / totalUnits;
    return Math.floor((packCents * share) / line.quantity);
  });

  let remainder = packCents - valid.reduce((sum, line, index) => sum + unitCents[index] * line.quantity, 0);
  for (let index = valid.length - 1; index >= 0 && remainder > 0; index -= 1) {
    const step = Math.floor(remainder / valid[index].quantity);
    if (step > 0) {
      unitCents[index] += step;
      remainder -= step * valid[index].quantity;
    }
  }

  valid.forEach((line, index) => result.set(line.key, unitCents[index] / 100));
  return result;
}

/** "Buy N, pay M" on one product: N units charged as M, spread across the N units. */
export function nxmUnitPrice(listUnitPrice: number, buyQuantity: number, payQuantity: number): number {
  if (buyQuantity <= 0 || payQuantity <= 0 || payQuantity >= buyQuantity) return listUnitPrice;
  const groupCents = Math.round(listUnitPrice * payQuantity * 100);
  return Math.floor(groupCents / buyQuantity) / 100;
}

export function packSavings(lines: PackLine[], packPrice: number): number {
  const listTotal = lines.reduce((sum, line) => sum + line.listUnitPrice * line.quantity, 0);
  return roundMoney(Math.max(0, listTotal - packPrice));
}
