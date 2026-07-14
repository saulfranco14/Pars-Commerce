"use client";

import { useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import {
  confirmPendingPayment,
  rejectPendingPayment,
  closeTableManually,
  mergeTableInto,
  unlinkTable,
  advanceOrderFulfillment,
  advanceDeviceFulfillment,
  advanceItemFulfillment,
  advanceAllFulfillment,
} from "@/features/qr/services/tableAdminClientService";

import type { AdminViewResponse } from "@/features/qr/services/tableAdminViewService";
import type { CloseReason } from "@/features/qr/services/tableCloseService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

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
  const [merging, setMerging] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
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

  async function mergeTable(secondaryOrderId: string) {
    if (!orderId) return false;
    setMerging(true);
    setError(null);
    try {
      await mergeTableInto({ primaryOrderId: orderId, secondaryOrderId });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudieron unir las mesas",
      );
      return false;
    } finally {
      setMerging(false);
    }
  }

  async function unlink() {
    if (!orderId) return false;
    setMerging(true);
    setError(null);
    try {
      await unlinkTable(orderId);
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo separar la mesa",
      );
      return false;
    } finally {
      setMerging(false);
    }
  }

  async function advanceFulfillment(status: FulfillmentStatus) {
    if (!orderId) return false;
    setAdvancing(true);
    setError(null);
    try {
      await advanceOrderFulfillment({ orderId, status });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el estado",
      );
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  async function advanceDevice(
    deviceId: string,
    status: FulfillmentStatus,
  ) {
    if (!orderId) return false;
    setBusyDeviceId(deviceId);
    setError(null);
    try {
      await advanceDeviceFulfillment({ orderId, deviceId, status });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el estado",
      );
      return false;
    } finally {
      setBusyDeviceId(null);
    }
  }

  async function advanceItem(orderItemId: string, status: FulfillmentStatus) {
    if (!orderId) return false;
    setBusyItemId(orderItemId);
    setError(null);
    try {
      await advanceItemFulfillment({ orderId, orderItemId, status });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el estado",
      );
      return false;
    } finally {
      setBusyItemId(null);
    }
  }

  async function advanceAll(status: FulfillmentStatus) {
    if (!orderId) return false;
    setAdvancing(true);
    setError(null);
    try {
      await advanceAllFulfillment({ orderId, status });
      await swr.mutate();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo actualizar el estado",
      );
      return false;
    } finally {
      setAdvancing(false);
    }
  }

  return {
    ...swr,
    busyPaymentId,
    closing,
    merging,
    advancing,
    busyDeviceId,
    busyItemId,
    error,
    resetError: () => setError(null),
    confirmPayment,
    rejectPayment,
    closeTable,
    mergeTable,
    unlink,
    advanceFulfillment,
    advanceDevice,
    advanceItem,
    advanceAll,
  };
}
