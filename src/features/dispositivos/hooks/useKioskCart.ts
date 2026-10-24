"use client";

import { useCallback, useMemo, useState } from "react";

import { priceOrder } from "@/lib/offers/orderPricing";
import type { MenuItem } from "@/features/qr/interfaces/tableCart";
import type { QrPromotion } from "@/features/qr/interfaces/promotion";

export interface KioskCartLine {
  product: MenuItem;
  quantity: number;
  unitPrice: number;
  listUnitPrice: number;
  promotionName: string | null;
}

export function useKioskCart(products: MenuItem[], promotions: QrPromotion[] = []) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const add = useCallback((productId: string, qty = 1) => setQuantities((map) => ({ ...map, [productId]: (map[productId] ?? 0) + qty })), []);
  const decrement = useCallback((productId: string) => setQuantities((map) => {
    const next = { ...map };
    const left = (next[productId] ?? 0) - 1;
    if (left <= 0) delete next[productId]; else next[productId] = left;
    return next;
  }), []);
  const removeLine = useCallback((productId: string) => setQuantities((map) => {
    const next = { ...map }; delete next[productId]; return next;
  }), []);
  const clear = useCallback(() => setQuantities({}), []);

  const pricing = useMemo(() => priceOrder({
    products: products.map((product) => ({ id: product.id, price: Number(product.price), subcatalog_id: product.subcatalog_id ?? null })),
    promotions,
    intents: Object.entries(quantities).map(([productId, quantity]) => ({ productId, quantity })),
    channel: "onsite",
    onsitePromotionsEnabled: true,
  }), [products, promotions, quantities]);
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const lines = useMemo<KioskCartLine[]>(() => pricing.ok ? pricing.lines.map((line) => ({
    product: byId.get(line.productId)!,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    listUnitPrice: line.listUnitPrice,
    promotionName: line.promotionName,
  })).filter((line) => Boolean(line.product)) : [], [byId, pricing]);

  return {
    quantities,
    lines,
    total: pricing.ok ? pricing.total : 0,
    listTotal: pricing.ok ? pricing.listTotal : 0,
    savings: pricing.ok ? pricing.savings : 0,
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    add, decrement, removeLine, clear,
  };
}
