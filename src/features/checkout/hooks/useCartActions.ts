import { useState } from "react";

import { dispatchCartUpdated } from "@/lib/cartEvents";
import { applyLineQuantity, cartTotals, removeCartLine } from "@/features/checkout/helpers/cartLineGroups";
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
  fingerprint: string | null;
  mutate: MutateFn;
}

export function useCartActions({
  cart,
  items,
  fingerprint,
  mutate,
}: UseCartActionsParams) {
  const [error, setError] = useState<string | null>(null);

  function showOptimistic(next: PublicCartItem[]) {
    if (!cart) return;
    const totals = cartTotals(next);
    mutate({ cart, items: next, subtotal: totals.subtotal, items_count: totals.itemsCount }, { revalidate: false });
  }

  // A pack line moves its whole group; the server applies the same rule.
  const handleQuantityChange = async (itemId: string, quantity: number) => {
    if (!cart || !fingerprint || quantity < 1) return;
    const grouped = Boolean(items.find((it) => it.id === itemId)?.group_id);
    showOptimistic(applyLineQuantity(items, itemId, quantity));
    setError(null);
    try {
      await updateItemQuantity(cart.id, itemId, quantity, fingerprint);
      if (grouped) mutate();
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleRemove = async (itemId: string) => {
    if (!cart || !fingerprint) return;
    showOptimistic(removeCartLine(items, itemId));
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
