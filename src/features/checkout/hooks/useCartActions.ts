import { useState } from "react";

import { dispatchCartUpdated } from "@/lib/cartEvents";
import {
  removeItem,
  updateItemQuantity,
  type PublicCartItem,
} from "@/services/publicCartService";

interface CartLike {
  id: string;
  tenant_id: string;
}

type MutateFn = (
  data?: {
    cart: CartLike;
    items: PublicCartItem[];
    subtotal: number;
    items_count: number;
  },
  opts?: { revalidate?: boolean },
) => void;

interface UseCartActionsParams {
  cart: CartLike | null;
  items: PublicCartItem[];
  subtotal: number;
  fingerprint: string | null;
  mutate: MutateFn;
}

export function useCartActions({
  cart,
  items,
  subtotal,
  fingerprint,
  mutate,
}: UseCartActionsParams) {
  const [error, setError] = useState<string | null>(null);

  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart || !fingerprint || quantity < 1) return;
    const updatedItems = items.map((it) =>
      it.id === itemId ? { ...it, quantity } : it,
    );
    const item = updatedItems.find((it) => it.id === itemId);
    const price = item ? Number(item.price_snapshot) : 0;
    const oldQty = items.find((i) => i.id === itemId)?.quantity ?? 0;
    const newSubtotal = subtotal + (quantity - oldQty) * price;
    mutate(
      {
        cart,
        items: updatedItems,
        subtotal: newSubtotal,
        items_count: updatedItems.reduce((s, i) => s + i.quantity, 0),
      },
      { revalidate: false },
    );
    setError(null);
    try {
      await updateItemQuantity(cart.id, itemId, quantity, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart || !fingerprint) return;
    const filtered = items.filter((it) => it.id !== itemId);
    const removed = items.find((it) => it.id === itemId);
    const newSubtotal = removed
      ? subtotal - Number(removed.price_snapshot) * removed.quantity
      : subtotal;
    mutate(
      {
        cart,
        items: filtered,
        subtotal: newSubtotal,
        items_count: filtered.reduce((s, i) => s + i.quantity, 0),
      },
      { revalidate: false },
    );
    setError(null);
    try {
      await removeItem(cart.id, itemId, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  return { error, setError, handleQuantityChange, handleRemove };
}
