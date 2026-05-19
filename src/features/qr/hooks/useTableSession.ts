"use client";

import { useEffect, useState } from "react";

import {
  clearDeviceName,
  getDeviceName,
  getLastOrderId,
  getOrCreateFingerprint,
  setLastOrderId,
} from "@/features/qr/helpers/deviceFingerprint";
import { resolveTableSession } from "@/features/qr/services/tableClientService";

import type { TableSessionResponse } from "@/features/qr/interfaces/tableSession";

interface UseTableSessionResult {
  data: TableSessionResponse | null;
  fingerprint: string;
  initialDeviceName: string | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Encapsulates everything required to bootstrap the customer's QR table view:
 *
 *  1. Generates / restores the per-token fingerprint from localStorage.
 *  2. Calls `/api/qr/resolve` with that fingerprint.
 *  3. Detects "new session" — when the QR rolled to a fresh order_id since
 *     this device last visited — and clears the cached display_name so the
 *     previous customer's identity does not leak into the new order.
 *  4. Returns the resolved data + the fingerprint + the device name to use
 *     as the initial value (DB display_name first, then localStorage).
 *
 * Components only consume the returned shape — they never see fetch/init logic.
 */
export function useTableSession(token: string): UseTableSessionResult {
  const [data, setData] = useState<TableSessionResponse | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const fp = getOrCreateFingerprint(token);
    setFingerprint(fp);

    resolveTableSession({ token, fingerprint: fp })
      .then((body) => {
        const currentOrderId = body.order?.id ?? null;
        const lastOrderId = getLastOrderId(token);
        const orderChanged =
          currentOrderId && lastOrderId && lastOrderId !== currentOrderId;
        if (body.is_new_session || orderChanged) {
          clearDeviceName(token);
        }
        if (currentOrderId) setLastOrderId(token, currentOrderId);
        setData(body);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la mesa.",
        );
      });
  }, [token]);

  const storedName = data ? getDeviceName(token) : null;
  const initialDeviceName =
    data?.my_device?.display_name?.trim() || storedName || null;

  return {
    data,
    fingerprint,
    initialDeviceName,
    error,
    isLoading: !data && !error,
  };
}
