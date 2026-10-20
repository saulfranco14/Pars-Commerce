"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import useSWR from "swr";

import { useFingerprint } from "@/hooks/useFingerprint";
import { CartDock } from "@/features/sitio/components/cart/CartDock";

import { getCart } from "@/services/publicCartService";
import { getCartUpdatedEventName } from "@/lib/cartEvents";

import type { StoreCartContextValue } from "@/features/sitio/interfaces/storeCart";

const CartContext = createContext<StoreCartContextValue | null>(null);

function cartFetcher([, tenantId, fingerprint]: readonly [string, string, string]) {
  return getCart(tenantId, fingerprint);
}

export function CartProvider({ tenantId, children }: { tenantId: string; children: React.ReactNode }) {
  const fingerprint = useFingerprint();
  const key = tenantId && fingerprint ? (["cart", tenantId, fingerprint] as const) : null;
  const { data, error, isLoading, mutate } = useSWR(key, cartFetcher, {
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  const [lastAdded, setLastAdded] = useState<StoreCartContextValue["lastAdded"]>(null);
  const onCartUpdated = useCallback(
    (event: Event) => {
      const detail = (event as CustomEvent<{ label?: string }>).detail;
      setLastAdded({ label: detail?.label ?? "Artículo agregado", at: Date.now() });
      void mutate();
    },
    [mutate],
  );

  useEffect(() => {
    window.addEventListener(getCartUpdatedEventName(), onCartUpdated);
    return () => window.removeEventListener(getCartUpdatedEventName(), onCartUpdated);
  }, [onCartUpdated]);

  const value: StoreCartContextValue = {
    cart: data?.cart ?? null,
    items: data?.items ?? [],
    subtotal: data?.subtotal ?? 0,
    itemsCount: data?.items_count ?? 0,
    isLoading,
    error: error ?? null,
    lastAdded,
    mutate,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDock itemsCount={value.itemsCount} subtotal={value.subtotal} lastAdded={lastAdded} />
    </CartContext.Provider>
  );
}

export function useCartContext(): StoreCartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
