"use client";

import { useCallback, useMemo, useState } from "react";

import type { MenuItem } from "@/features/qr/interfaces/tableCart";

export interface KioskCartLine {
  product: MenuItem;
  quantity: number;
}

/**
 * Carrito de la pantalla de autoservicio: cantidades por producto y los totales
 * derivados. Vive en un hook porque tres componentes lo leen (rejilla, panel y
 * barra) y ninguno debe recalcular el total por su cuenta.
 */
export function useKioskCart(products: MenuItem[]) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const add = useCallback((productId: string, qty = 1) => {
    setQuantities((m) => ({ ...m, [productId]: (m[productId] ?? 0) + qty }));
  }, []);

  const decrement = useCallback((productId: string) => {
    setQuantities((m) => {
      const next = { ...m };
      const left = (next[productId] ?? 0) - 1;
      if (left <= 0) delete next[productId];
      else next[productId] = left;
      return next;
    });
  }, []);

  const removeLine = useCallback((productId: string) => {
    setQuantities((m) => {
      const next = { ...m };
      delete next[productId];
      return next;
    });
  }, []);

  const clear = useCallback(() => setQuantities({}), []);

  const lines = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    return Object.entries(quantities).flatMap(([id, quantity]) => {
      const product = byId.get(id);
      return product ? [{ product, quantity }] : [];
    });
  }, [quantities, products]);

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => sum + Number(l.product.price) * l.quantity, 0),
    [lines],
  );
  const itemCount = useMemo(
    () => lines.reduce((sum, l) => sum + l.quantity, 0),
    [lines],
  );

  return {
    quantities,
    lines,
    total,
    itemCount,
    add,
    decrement,
    removeLine,
    clear,
  };
}
