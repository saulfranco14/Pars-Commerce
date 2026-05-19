"use client";

import { useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import {
  confirmPendingPayment,
  rejectPendingPayment,
  closeTableManually,
} from "@/features/qr/services/tableAdminClientService";

import type { AdminViewResponse } from "@/features/qr/services/tableAdminViewService";
import type { CloseReason } from "@/features/qr/services/tableCloseService";

interface UseTableAdminLiveOptions {
  refreshIntervalMs?: number;
}

/**
 * Live admin view for a single table order. Owns:
 *  - SWR fetch with auto-refresh
 *  - confirm / reject / close actions with shared busy/error state
 *
 * Components are pure presentational and just call the handlers exposed here.
 */
export function useTableAdminLive(
  orderId: string | null,
  options: UseTableAdminLiveOptions = {},
) {
  const refreshInterval = options.refreshIntervalMs ?? 5000;

  const key = orderId
    ? `/api/qr/table/${encodeURIComponent(orderId)}/admin-view`
    : null;

  const swr = useSWR<AdminViewResponse>(key, swrFetcher, { refreshInterval });

  const [busyPaymentId, setBusyPaymentId] = useState<string | null>(null);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmPayment(paymentId: string) {
    setBusyPaymentId(paymentId);
    setError(null);
    try {
      await confirmPendingPayment(paymentId);
      await swr.mutate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo confirmar el pago",
      );
    } finally {
      setBusyPaymentId(null);
    }
  }

  async function rejectPayment(paymentId: string, reason?: string) {
    setBusyPaymentId(paymentId);
    setError(null);
    try {
      await rejectPendingPayment(paymentId, reason);
      await swr.mutate();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo rechazar el pago",
      );
    } finally {
      setBusyPaymentId(null);
    }
  }

  async function closeTable(payload: {
    reason: CloseReason;
    reasonDetails?: string;
  }) {
    if (!orderId) return;
    setClosing(true);
    setError(null);
    try {
      await closeTableManually({ orderId, ...payload });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cerrar la mesa",
      );
      return false;
    } finally {
      setClosing(false);
    }
  }

  return {
    ...swr,
    busyPaymentId,
    closing,
    error,
    resetError: () => setError(null),
    confirmPayment,
    rejectPayment,
    closeTable,
  };
}
