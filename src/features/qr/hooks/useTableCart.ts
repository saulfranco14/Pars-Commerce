"use client";

import { useEffect, useMemo, useState } from "react";

import { sendItems } from "@/features/qr/services/tableClientService";

import type { CartEntry, MenuItem } from "@/features/qr/interfaces/tableCart";

interface UseTableCartParams {
  menu: MenuItem[];
  orderId: string | null;
  qrToken: string;
  fingerprint: string;
}

interface UseTableCartResult {
  entries: CartEntry[];
  total: number;
  itemCount: number;
  quantitiesByProduct: Record<string, number>;
  saving: boolean;
  error: string | null;
  confirmation: boolean;
  add: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  send: () => Promise<void>;
  dismissConfirmation: () => void;
}

/**
 * Owns the customer-side cart: local list of entries, derived totals, and
 * the call that submits them to `/api/qr/table/items`. Components stay
 * presentational and just wire handlers from here.
 */
export function useTableCart({
  menu,
  orderId,
  qrToken,
  fingerprint,
}: UseTableCartParams): UseTableCartResult {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState(false);

  useEffect(() => {
    if (!confirmation) return;
    const t = setTimeout(() => setConfirmation(false), 4000);
    return () => clearTimeout(t);
  }, [confirmation]);

  const total = useMemo(
    () => entries.reduce((acc, e) => acc + e.unit_price * e.quantity, 0),
    [entries],
  );
  const itemCount = useMemo(
    () => entries.reduce((acc, e) => acc + e.quantity, 0),
    [entries],
  );
  const quantitiesByProduct = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.product_id] = e.quantity;
    return map;
  }, [entries]);

  function add(productId: string) {
    const product = menu.find((m) => m.id === productId);
    if (!product) return;
    setEntries((prev) => {
      const existing = prev.find((e) => e.product_id === productId);
      if (existing) {
        return prev.map((e) =>
          e.product_id === productId ? { ...e, quantity: e.quantity + 1 } : e,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          unit_price: Number(product.price),
          quantity: 1,
        },
      ];
    });
  }

  function decrement(productId: string) {
    setEntries((prev) =>
      prev
        .map((e) =>
          e.product_id === productId ? { ...e, quantity: e.quantity - 1 } : e,
        )
        .filter((e) => e.quantity > 0),
    );
  }

  function remove(productId: string) {
    setEntries((prev) => prev.filter((e) => e.product_id !== productId));
  }

  async function send() {
    if (!orderId || entries.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await sendItems({
        orderId,
        qrToken,
        fingerprint,
        items: entries.map((e) => ({
          product_id: e.product_id,
          quantity: e.quantity,
        })),
      });
      setEntries([]);
      setConfirmation(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el pedido");
    } finally {
      setSaving(false);
    }
  }

  function dismissConfirmation() {
    setConfirmation(false);
  }

  return {
    entries,
    total,
    itemCount,
    quantitiesByProduct,
    saving,
    error,
    confirmation,
    add,
    decrement,
    remove,
    send,
    dismissConfirmation,
  };
}
