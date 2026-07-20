"use client";

import { swrFetcher } from "@/lib/swrFetcher";
import useSWR from "swr";

import { buildQrResolveKey } from "@/features/qr/helpers/buildQrKey";

export function useQRSession(token: string | null) {
  const key = buildQrResolveKey(token);
  const { data, error, isLoading, mutate } = useSWR(key, swrFetcher, {
    revalidateOnFocus: false,
  });
  return { data, error, isLoading, mutate };
}
