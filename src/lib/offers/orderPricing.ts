import { planPromotionGroup } from "@/lib/offers/groupPricing";
import {
  bestUnitPromotion,
  GROUP_PROMOTION_TYPES,
  isPromotionAvailable,
  roundMoney,
  type PricingProduct,
  type PricingPromotion,
  type PromotionChannel,
} from "@/lib/offers/pricing";

export interface OrderPricingIntent {
  productId: string;
  quantity: number;
  promotionId?: string | null;
  offerGroupId?: string | null;
  isShared?: boolean;
}

export interface PricedOrderLine {
  productId: string;
  quantity: number;
  unitPrice: number;
  listUnitPrice: number;
  subtotal: number;
  savings: number;
  promotionId: string | null;
  promotionName: string | null;
  offerGroupId: string | null;
  isShared: boolean;
}

export type PriceOrderResult =
  | { ok: true; lines: PricedOrderLine[]; listTotal: number; total: number; savings: number }
  | { ok: false; code: "invalid_items" | "promotion_unavailable"; message: string };

export function priceOrder(input: {
  products: PricingProduct[];
  promotions: PricingPromotion[];
  intents: OrderPricingIntent[];
  channel: PromotionChannel;
  onsitePromotionsEnabled?: boolean;
  now?: Date;
}): PriceOrderResult {
  const products = new Map(input.products.map((product) => [product.id, product]));
  if (input.intents.length === 0 || input.intents.some((line) => !Number.isInteger(line.quantity) || line.quantity <= 0 || !products.has(line.productId))) {
    return { ok: false, code: "invalid_items", message: "El pedido contiene productos o cantidades inválidas." };
  }

  const listTotal = roundMoney(input.intents.reduce((sum, line) => {
    return sum + Number(products.get(line.productId)?.price ?? 0) * line.quantity;
  }, 0));
  const promotions = input.promotions.filter((promotion) => isPromotionAvailable(promotion, {
    channel: input.channel,
    onsitePromotionsEnabled: input.onsitePromotionsEnabled,
    cartListSubtotal: listTotal,
    now: input.now,
  }));
  const promotionById = new Map(promotions.map((promotion) => [promotion.id, promotion]));
  const priced: PricedOrderLine[] = [];

  const grouped = new Map<string, OrderPricingIntent[]>();
  for (const intent of input.intents) {
    if (!intent.offerGroupId) continue;
    const current = grouped.get(intent.offerGroupId) ?? [];
    current.push(intent);
    grouped.set(intent.offerGroupId, current);
  }

  for (const [groupId, groupLines] of grouped) {
    const promotionId = groupLines[0]?.promotionId;
    const promotion = promotionId ? promotionById.get(promotionId) : null;
    if (!promotion || !GROUP_PROMOTION_TYPES.has(promotion.type) || groupLines.some((line) => line.promotionId !== promotionId)) {
      return { ok: false, code: "promotion_unavailable", message: "Una promoción agrupada ya no está disponible." };
    }
    const plan = planPromotionGroup(
      promotion,
      new Map(input.products.map((product) => [product.id, Number(product.price)])),
      groupLines[0]?.productId,
    );
    if (!plan.ok) return { ok: false, code: "promotion_unavailable", message: plan.error.message };
    const multiplier = groupLines[0].quantity / (plan.data.find((line) => line.productId === groupLines[0].productId)?.unitQuantity ?? 1);
    const validMultiplier = Number.isInteger(multiplier) && multiplier > 0;
    const exact = validMultiplier && plan.data.length === groupLines.length && plan.data.every((planned) => {
      const supplied = groupLines.find((line) => line.productId === planned.productId);
      return supplied?.quantity === planned.unitQuantity * multiplier;
    });
    if (!exact) return { ok: false, code: "promotion_unavailable", message: "El paquete promocional está incompleto." };
    for (const planned of plan.data) {
      const supplied = groupLines.find((line) => line.productId === planned.productId)!;
      const unitPrice = roundMoney(planned.unitPrice);
      const listUnitPrice = roundMoney(planned.listUnitPrice);
      priced.push({
        productId: planned.productId,
        quantity: supplied.quantity,
        unitPrice,
        listUnitPrice,
        subtotal: roundMoney(unitPrice * supplied.quantity),
        savings: roundMoney((listUnitPrice - unitPrice) * supplied.quantity),
        promotionId: promotion.id,
        promotionName: promotion.name ?? null,
        offerGroupId: groupId,
        isShared: supplied.isShared === true,
      });
    }
  }

  for (const intent of input.intents.filter((line) => !line.offerGroupId)) {
    const product = products.get(intent.productId)!;
    const best = bestUnitPromotion(promotions, product, input.now, {
      channel: input.channel,
      onsitePromotionsEnabled: input.onsitePromotionsEnabled,
      cartListSubtotal: listTotal,
    });
    const unitPrice = roundMoney(best?.finalPrice ?? product.price);
    const listUnitPrice = roundMoney(product.price);
    priced.push({
      productId: intent.productId,
      quantity: intent.quantity,
      unitPrice,
      listUnitPrice,
      subtotal: roundMoney(unitPrice * intent.quantity),
      savings: roundMoney((listUnitPrice - unitPrice) * intent.quantity),
      promotionId: best?.promotionId ?? null,
      promotionName: best ? promotionById.get(best.promotionId)?.name ?? null : null,
      offerGroupId: null,
      isShared: intent.isShared === true,
    });
  }

  const total = roundMoney(priced.reduce((sum, line) => sum + line.subtotal, 0));
  return { ok: true, lines: priced, listTotal, total, savings: roundMoney(listTotal - total) };
}
