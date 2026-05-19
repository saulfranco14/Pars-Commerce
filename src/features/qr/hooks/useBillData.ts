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
}

export interface BillDevice {
  id: string;
  display_name: string | null;
  color_hex: string;
}

export interface BillResponse {
  order: {
    id: string;
    status: string;
    total: number;
    paid_total: number;
    balance_due: number;
    created_at: string;
    payment_method: string | null;
  };
  tenant?: { id: string; name: string; slug: string } | null;
  qr_code?: { id: string; label: string } | null;
  groups: SplitGroup[];
  items: BillItem[];
  devices: BillDevice[];
  my_device_id: string | null;
}

interface UseBillDataOptions {
  refreshIntervalMs?: number;
}

/**
 * Encapsulates fetching the customer's bill + auto-refresh. Owns:
 *  - device fingerprint resolution (localStorage)
 *  - SWR cache keyed by (url, fingerprint)
 *  - fetcher that adds the x-fingerprint-id header
 *
 * Components only consume `{ data, isLoading, error, mutate }` and stay
 * free of fetch wiring.
 */
export function useBillData(
  token: string,
  orderId: string | null,
  options: UseBillDataOptions = {},
) {
  const refreshInterval = options.refreshIntervalMs ?? 3000;

  const [fingerprint, setFingerprint] = useState<string>("");
  useEffect(() => {
    if (!token) return;
    setFingerprint(getOrCreateFingerprint(token));
  }, [token]);

  const key =
    orderId && fingerprint
      ? [`/api/qr/table/${encodeURIComponent(orderId)}/bill`, fingerprint]
      : null;

  const swr = useSWR<BillResponse>(
    key,
    async ([url, fp]: [string, string]) => {
      const res = await fetch(url, { headers: { "x-fingerprint-id": fp } });
      if (!res.ok) throw new Error("No se pudo cargar la cuenta");
      return res.json();
    },
    { refreshInterval },
  );

  return {
    fingerprint,
    ...swr,
  };
}
