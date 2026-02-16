"use client";

import useSWR from "swr";
import { useEffect } from "react";
import { getCart } from "@/services/publicCartService";
import { getCartUpdatedEventName } from "@/lib/cartEvents";

function cartFetcher([_, tenantId, fingerprint]: [string, string, string]) {
  return getCart(tenantId, fingerprint);
}

export function useCart(tenantId: string | undefined, fingerprint: string | null | undefined) {
  const key =
    tenantId && fingerprint ? (["cart", tenantId, fingerprint] as const) : null;
  const { data, error, isLoading, mutate } = useSWR(key, cartFetcher, {
    dedupingInterval: 10000,
    revalidateOnFocus: false,
  });

  useEffect(() => {
    const handler = () => mutate();
    window.addEventListener(getCartUpdatedEventName(), handler);
    return () => window.removeEventListener(getCartUpdatedEventName(), handler);
  }, [mutate]);

  return {
    itemsCount: data?.items_count ?? 0,
    cart: data?.cart ?? null,
    items: data?.items ?? [],
    subtotal: data?.subtotal ?? 0,
    isLoading,
    error,
    mutate,
  };
}
