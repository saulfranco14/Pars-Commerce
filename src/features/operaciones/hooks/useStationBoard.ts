"use client";

import { useRef, useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { isAbortError } from "@/services/apiFetch";
import { update as updateOrder } from "@/services/ordersService";
import {
  advanceOrderItemFulfillment,
  advanceWholeOrderFulfillment,
} from "@/features/orders/services/fulfillmentClientService";
import {
  createOrderDeliveryEvent,
  updatePublicOrderRequest,
} from "@/features/orders/services/orderActionService";
import {
  confirmManualPayment,
  rejectManualPayment,
} from "@/features/orders/services/manualPaymentService";
import { BOARD_REFRESH_MS } from "@/features/operaciones/constants/stations";
import { stationBoardKey } from "@/features/operaciones/helpers/boardKey";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type { BoardView, StationBoard } from "@/features/operaciones/interfaces/board";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";
import type { OrderDeliveryEventType } from "@/features/orders/services/orderActionService";

/** One station's columns plus the actions its cards can run; every action refreshes the board. */
export function useStationBoard(tenantId: string | null, station: StationKey, view: BoardView = "active") {
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const { data, error, isLoading, isValidating, mutate } = useSWR<StationBoard>(
    tenantId ? stationBoardKey(tenantId, station, view) : null,
    swrFetcher,
    {
      refreshInterval: BOARD_REFRESH_MS,
      revalidateOnFocus: true,
      keepPreviousData: true,
      onSuccess: () => setUpdatedAt(Date.now()),
    },
  );
  // Keys in flight: the order id, "order:item" while one product line moves, or "pay:id".
  const [busyKeys, setBusyKeys] = useState<string[]>([]);
  // Read synchronously so a second tap before React re-renders is still ignored.
  const lockedRef = useRef(new Set<string>());
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  /** One action per order at a time; other orders stay usable meanwhile. */
  async function run(key: string, action: () => Promise<unknown>, success?: string): Promise<boolean> {
    const lock = key.startsWith("pay:") ? key : key.split(":")[0];
    if (lockedRef.current.has(lock)) return false;
    lockedRef.current.add(lock);
    setBusyKeys((keys) => [...keys, key]);
    setActionError(null);
    setNotice(null);
    try {
      await action();
      await mutate();
      if (success) setNotice(success);
      return true;
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
      return false;
    } finally {
      lockedRef.current.delete(lock);
      setBusyKeys((keys) => keys.filter((k) => k !== key));
    }
  }

  const busyItemOf = (orderId: string) => {
    const key = busyKeys.find((k) => k.startsWith(`${orderId}:`));
    return key ? key.slice(orderId.length + 1) : null;
  };

  return {
    board: data ?? null,
    loading: isLoading && !data,
    refreshing: isValidating,
    updatedAt,
    loadError: error && !isAbortError(error) ? (error instanceof Error ? error.message : "No se pudo cargar.") : null,
    actionError,
    notice,
    /** Any action running on this order: every button of its card waits. */
    isBusy: (orderId: string) => busyKeys.some((k) => k === orderId || k.startsWith(`${orderId}:`)),
    busyItemOf,
    refresh: () => mutate(),
    advance: (orderId: string, status: FulfillmentStatus) =>
      run(orderId, () => advanceWholeOrderFulfillment(orderId, status)),
    advanceItem: (orderId: string, itemId: string, status: FulfillmentStatus) =>
      run(`${orderId}:${itemId}`, () => advanceOrderItemFulfillment(orderId, itemId, status)),
    assign: (order: { id: string; number: string; originLabel: string }, member: { userId: string; name: string }) =>
      run(
        order.id,
        async () => {
          const saved = (await updateOrder(order.id, { assigned_to: member.userId })) as { assigned_to?: string | null };
          // Say so instead of looking done when the server kept someone else.
          if (saved?.assigned_to !== member.userId) {
            throw new Error(`No se pudo pasar ${order.originLabel} a ${member.name}. Vuelve a intentarlo.`);
          }
        },
        `${order.originLabel} (#${order.number}) ahora la atiende ${member.name}.`,
      ),
    respondRequest: (orderId: string, action: "accept-request" | "reject-request") =>
      run(orderId, () => updatePublicOrderRequest(orderId, action)),
    deliveryEvent: (orderId: string, type: OrderDeliveryEventType, photo?: File, note?: string) =>
      run(orderId, () => createOrderDeliveryEvent(orderId, type, photo, note)),
    confirmPayment: (paymentId: string) => run(`pay:${paymentId}`, () => confirmManualPayment(paymentId)),
    rejectPayment: (paymentId: string) => run(`pay:${paymentId}`, () => rejectManualPayment(paymentId)),
    busyPaymentId: busyKeys.find((k) => k.startsWith("pay:"))?.slice(4) ?? null,
  };
}

export type StationBoardController = ReturnType<typeof useStationBoard>;
