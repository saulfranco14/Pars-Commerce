"use client";

import { swrFetcher } from "@/lib/swrFetcher";
import useSWR from "swr";

export function useTableOrder(orderId: string | null) {
  const key = orderId ? `/api/orders?order_id=${encodeURIComponent(orderId)}` : null;
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher, {
    revalidateOnFocus: false,
    refreshInterval: orderId ? 5000 : 0,
  });
  return { data, error, isLoading, mutate };
}
