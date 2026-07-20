"use client";

import { useCallback, useMemo, useState } from "react";

import { createStaffOrder } from "@/features/qr/services/staffOrderClientService";

import type { CreateStaffOrderResponse } from "@/features/qr/services/staffOrderClientService";
import type { ProductListItem } from "@/types/products";

interface UseStaffOrderBuilderParams {
  tenantId: string;
  /** When set, items append to this table order instead of a new counter one. */
  tableOrderId?: string;
}

export interface StaffCartLine {
  product: ProductListItem;
  quantity: number;
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateStaffOrderResponse | null>(null);

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

  const lines = useMemo<StaffCartLine[]>(
    () =>
      Object.entries(qtyByProduct)
        .map(([id, quantity]) => {
          const product = productById[id];
          return product ? { product, quantity } : null;
        })
        .filter((l): l is StaffCartLine => l !== null),
    [qtyByProduct, productById],
  );

  const total = useMemo(
    () => lines.reduce((a, l) => a + Number(l.product.price) * l.quantity, 0),
    [lines],
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
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el pedido");
    } finally {
      setSubmitting(false);
    }
  }, [lines, tenantId, customerName, tableOrderId]);

  const reset = useCallback(() => {
    setQtyByProduct({});
    setProductById({});
    setCustomerName("");
    setResult(null);
    setError(null);
  }, []);

  return {
    lines,
    qtyByProduct,
    total,
    itemCount,
    customerName,
    setCustomerName,
    add,
    decrement,
    submit,
    submitting,
    error,
    result,
    reset,
  };
}
