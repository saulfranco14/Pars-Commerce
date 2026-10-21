import { allocatePackPrice, applyUnitPromotion, nxmUnitPrice, roundMoney } from "@/lib/offers/pricing";

import type { PromotionMechanic } from "@/features/promociones/interfaces/offerTemplate";

export interface PreviewItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface PromotionPreview {
  /** What the customer pays for the example (one item, one pack or one NxM group). */
  finalTotal: number;
  listTotal: number;
  savings: number;
  savingsPercent: number;
  caption: string;
}

function percentOff(listTotal: number, savings: number): number {
  return listTotal > 0 ? Math.round((savings / listTotal) * 100) : 0;
}

/** The price story the wizard shows: "Pagas $X, ahorras $Y". Null when there is nothing to price yet. */
export function previewPromotion(input: {
  mechanic: PromotionMechanic;
  value: number;
  buyQuantity?: number;
  payQuantity?: number;
  items: PreviewItem[];
}): PromotionPreview | null {
  const items = input.items.filter((item) => item.quantity > 0);
  if (items.length === 0 || input.mechanic === "event_badge") return null;

  if (input.mechanic === "bundle_price") {
    const listTotal = roundMoney(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
    const prices = allocatePackPrice(
      items.map((item) => ({ key: item.id, listUnitPrice: item.price, quantity: item.quantity })),
      input.value,
    );
    const finalTotal = roundMoney(items.reduce((sum, item) => sum + (prices.get(item.id) ?? 0) * item.quantity, 0));
    const savings = roundMoney(Math.max(0, listTotal - finalTotal));
    return {
      finalTotal,
      listTotal,
      savings,
      savingsPercent: percentOff(listTotal, savings),
      caption: `Paquete de ${items.reduce((sum, item) => sum + item.quantity, 0)} piezas`,
    };
  }

  const [first] = items;
  if (input.mechanic === "nxm") {
    const buy = input.buyQuantity ?? 2;
    const pay = input.payQuantity ?? 1;
    const listTotal = roundMoney(first.price * buy);
    const finalTotal = roundMoney(nxmUnitPrice(first.price, buy, pay) * buy);
    const savings = roundMoney(Math.max(0, listTotal - finalTotal));
    return { finalTotal, listTotal, savings, savingsPercent: percentOff(listTotal, savings), caption: `${buy} ${first.name}` };
  }

  const finalTotal = applyUnitPromotion(first.price, { type: input.mechanic, value: input.value }).finalPrice;
  const savings = roundMoney(Math.max(0, first.price - finalTotal));
  return {
    finalTotal,
    listTotal: first.price,
    savings,
    savingsPercent: percentOff(first.price, savings),
    caption: items.length > 1 ? `${first.name} y ${items.length - 1} más` : first.name,
  };
}
