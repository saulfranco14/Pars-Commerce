"use client";

import { useCallback, useMemo, useState } from "react";
import useSWR from "swr";

import { createStaffOrder } from "@/features/qr/services/staffOrderClientService";

import type { CreateStaffOrderResponse } from "@/features/qr/services/staffOrderClientService";
import type { ProductListItem } from "@/types/products";
import type { PricingPromotion } from "@/lib/offers/pricing";
import { priceOrder } from "@/lib/offers/orderPricing";
import { swrFetcher } from "@/lib/swrFetcher";

interface UseStaffOrderBuilderParams {
  tenantId: string;
  /** When set, items append to this table order instead of a new counter one. */
  tableOrderId?: string;
}

export interface StaffCartLine {
  product: ProductListItem;
  quantity: number;
  unitPrice: number;
  listUnitPrice: number;
  promotionName: string | null;
}

/**
 * Dashboard state for a staff member building a customer's order: a quantity
 * map keyed by product id, running total, and submit. Mirrors the shape of
 * `useTableCart` but for the authenticated dashboard side (no fingerprint).
 * Components stay presentational.
 */
export function useStaffOrderBuilder({
  tenantId,
  tableOrderId,
}: UseStaffOrderBuilderParams) {
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});
  const [productById, setProductById] = useState<
    Record<string, ProductListItem>
  >({});
  const [customerName, setCustomerName] = useState("");
  // In table mode, staff attributes the new lines to one of the people already
  // connected to the table. Counter orders intentionally leave this empty.
  const [assignedDeviceId, setAssignedDeviceId] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStaffOrderResponse | null>(null);
  const { data: promotionRows } = useSWR<PricingPromotion[]>(
    tenantId ? `/api/promotions?tenant_id=${encodeURIComponent(tenantId)}&active_only=true` : null,
    swrFetcher,
  );
  const onsitePromotions = useMemo(
    () => (promotionRows ?? []).filter((promotion) =>
      !promotion.sales_channels?.length || promotion.sales_channels.includes("onsite"),
    ),
    [promotionRows],
  );

  const add = useCallback((product: ProductListItem) => {
    setProductById((m) => ({ ...m, [product.id]: product }));
    setQtyByProduct((q) => ({ ...q, [product.id]: (q[product.id] ?? 0) + 1 }));
  }, []);

  const decrement = useCallback((productId: string) => {
    setQtyByProduct((q) => {
      const next = { ...q };
      const v = (next[productId] ?? 0) - 1;
      if (v <= 0) delete next[productId];
      else next[productId] = v;
      return next;
    });
  }, []);

  const pricing = useMemo(() => priceOrder({
    products: Object.values(productById).map((product) => ({ id: product.id, price: Number(product.price), subcatalog_id: product.subcatalog_id ?? null })),
    promotions: onsitePromotions,
    intents: Object.entries(qtyByProduct).map(([productId, quantity]) => ({ productId, quantity })),
    channel: "onsite",
    onsitePromotionsEnabled: true,
  }), [onsitePromotions, productById, qtyByProduct]);
  const lines = useMemo<StaffCartLine[]>(() => pricing.ok ? pricing.lines.map((line) => ({
    product: productById[line.productId],
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    listUnitPrice: line.listUnitPrice,
    promotionName: line.promotionName,
  })).filter((line) => Boolean(line.product)) : [], [pricing, productById]);

  const total = useMemo(
    () => pricing.ok ? pricing.total : 0,
    [pricing],
  );
  const itemCount = useMemo(
    () => lines.reduce((a, l) => a + l.quantity, 0),
    [lines],
  );

  const submit = useCallback(async () => {
    if (lines.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await createStaffOrder({
        tenantId,
        items: lines.map((l) => ({
          product_id: l.product.id,
          quantity: l.quantity,
        })),
        customerName: customerName.trim() || undefined,
        tableOrderId,
        deviceId: assignedDeviceId,
        expectedTotal: total,
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido");
    } finally {
      setSubmitting(false);
    }
  }, [lines, tenantId, customerName, tableOrderId, assignedDeviceId, total]);

  const reset = useCallback(() => {
    setQtyByProduct({});
    setProductById({});
    setCustomerName("");
    setAssignedDeviceId(undefined);
    setResult(null);
    setError(null);
  }, []);

  return {
    lines,
    qtyByProduct,
    total,
    listTotal: pricing.ok ? pricing.listTotal : total,
    savings: pricing.ok ? pricing.savings : 0,
    itemCount,
    customerName,
    setCustomerName,
    assignedDeviceId,
    setAssignedDeviceId,
    add,
    decrement,
    submit,
    submitting,
    error,
    result,
    reset,
  };
}
