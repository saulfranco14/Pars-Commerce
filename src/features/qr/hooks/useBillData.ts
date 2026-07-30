"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";

import { getOrCreateFingerprint } from "@/features/qr/helpers/deviceFingerprint";

import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

export interface BillItem {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  added_by_device_id: string | null;
  is_shared: boolean;
  origin_table_label: string | null;
  created_at: string | null;
  fulfillment_status?: string;
}

export interface BillDevice {
  id: string;
  display_name: string | null;
  color_hex: string;
  fulfillment_status?: string;
}

export interface BillResponse {
  order: {
    id: string;
    /** El número que el cliente canta en el mostrador. */
    order_number: string | null;
    status: string;
    fulfillment_status: string;
    total: number;
    paid_total: number;
    balance_due: number;
    created_at: string;
    payment_method: string | null;
  };
  tenant?: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string | null;
  } | null;
  qr_code?: { id: string; label: string } | null;
  groups: SplitGroup[];
  items: BillItem[];
  devices: BillDevice[];
  my_device_id: string | null;
  /** This caller's own preparation state — gates "pagar mi parte". */
  my_fulfillment_status?: string;
  i_am_owner?: boolean;
  is_linked?: boolean;
  linked_labels?: string[];
  incoming_merge_request?: {
    id: string;
    requester_label: string;
    expires_at: string;
  } | null;
  outgoing_merge_request?: {
    id: string;
    target_label: string;
    expires_at: string;
  } | null;
}

interface UseBillDataOptions {
  refreshIntervalMs?: number;
}

function receiptCacheKey(token: string, orderId: string): string {
  return `tlaco:receipt:${token}:${orderId}`;
}

function readCachedReceipt(token: string, orderId: string | null): BillResponse | undefined {
  if (!orderId || typeof window === "undefined") return undefined;
  try {
    const raw = window.localStorage.getItem(receiptCacheKey(token, orderId));
    return raw ? (JSON.parse(raw) as BillResponse) : undefined;
  } catch {
    return undefined;
  }
}

function cacheTerminalReceipt(token: string, data: BillResponse): void {
  if (
    typeof window === "undefined" ||
    data.order.status !== "paid" ||
    data.order.fulfillment_status !== "ready"
  )
    return;
  try {
    window.localStorage.setItem(
      receiptCacheKey(token, data.order.id),
      JSON.stringify(data),
    );
  } catch {
    // The live receipt remains available even when browser storage is blocked.
  }
}

export function useBillData(
  token: string,
  orderId: string | null,
  options: UseBillDataOptions = {},
) {
  const refreshInterval = options.refreshIntervalMs ?? 3000;
  // Browser storage cannot be read while the server renders. Waiting until the
  // first client effect keeps the server and client HTML identical.
  const [cachedReceipt, setCachedReceipt] = useState<BillResponse>();
  const [cacheReady, setCacheReady] = useState(false);

  useEffect(() => {
    setCachedReceipt(readCachedReceipt(token, orderId));
    setCacheReady(true);
  }, [token, orderId]);

  const [fingerprint, setFingerprint] = useState<string>("");
  useEffect(() => {
    if (!token) return;
    setFingerprint(getOrCreateFingerprint(token));
  }, [token]);

  const key =
    orderId && fingerprint && cacheReady
      ? [`/api/qr/table/${encodeURIComponent(orderId)}/bill`, fingerprint]
      : null;

  const swr = useSWR<BillResponse>(
    key,
    async ([url, fp]: [string, string]) => {
      const res = await fetch(url, { headers: { "x-fingerprint-id": fp } });
      if (!res.ok) throw new Error("No se pudo cargar la cuenta");
      return res.json();
    },
    {
      // The full bill is an expensive aggregate. Once payment is final it is
      // immutable here; live fulfillment moves to the lightweight QR pulse.
      refreshInterval: (latest) =>
        latest &&
        ["paid", "completed", "cancelled"].includes(latest.order.status)
          ? 0
          : refreshInterval,
      dedupingInterval: refreshInterval,
      fallbackData: cachedReceipt,
      // A terminal receipt is immutable for the customer. Reuse its local copy
      // on re-entry instead of paying for the full aggregate again.
      revalidateOnMount: !cachedReceipt,
      revalidateIfStale: !cachedReceipt,
      revalidateOnFocus: false,
      onSuccess: (latest) => cacheTerminalReceipt(token, latest),
    },
  );

  return {
    fingerprint,
    ...swr,
    // Before the post-hydration cache read, preserve the skeleton instead of
    // rendering an error state with server/client-divergent data.
    isLoading: !cacheReady || swr.isLoading,
  };
}
