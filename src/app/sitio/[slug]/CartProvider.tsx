"use client";

import { createContext, useContext, useCallback, useEffect } from "react";
import useSWR from "swr";
import { getCart } from "@/services/publicCartService";
import { getCartUpdatedEventName } from "@/lib/cartEvents";
import { useFingerprint } from "@/hooks/useFingerprint";
import type { PublicCartItem } from "@/services/publicCartService";

interface CartData {
  cart: { id: string; tenant_id: string } | null;
  items: PublicCartItem[];
  subtotal: number;
  items_count: number;
}

interface CartContextValue {
  cart: CartData["cart"];
  items: PublicCartItem[];
  subtotal: number;
  itemsCount: number;
  isLoading: boolean;
  error: Error | null;
  mutate: (data?: CartData, opts?: { revalidate?: boolean }) => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function cartFetcher([_, tenantId, fingerprint]: [string, string, string]) {
  return getCart(tenantId, fingerprint);
}

interface CartProviderProps {
  tenantId: string;
  children: React.ReactNode;
}

export function CartProvider({ tenantId, children }: CartProviderProps) {
  const fingerprint = useFingerprint();
  const key =
    tenantId && fingerprint ? (["cart", tenantId, fingerprint] as const) : null;
  const { data, error, isLoading, mutate } = useSWR(key, cartFetcher, {
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  const onCartUpdated = useCallback(() => mutate(), [mutate]);
  useEffect(() => {
    window.addEventListener(getCartUpdatedEventName(), onCartUpdated);
    return () => window.removeEventListener(getCartUpdatedEventName(), onCartUpdated);
  }, [onCartUpdated]);

  const value: CartContextValue = {
    cart: data?.cart ?? null,
    items: data?.items ?? [],
    subtotal: data?.subtotal ?? 0,
    itemsCount: data?.items_count ?? 0,
    isLoading,
    error: error ?? null,
    mutate,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCartContext must be used within CartProvider");
  }
  return ctx;
}
