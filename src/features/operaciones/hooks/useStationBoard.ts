"use client";

import { useState } from "react";
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
import { BOARD_REFRESH_MS } from "@/features/operaciones/constants/stations";
import { stationBoardKey } from "@/features/operaciones/helpers/boardKey";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type { BoardView, StationBoard } from "@/features/operaciones/interfaces/board";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";
import type { OrderDeliveryEventType } from "@/features/orders/services/orderActionService";

/** One station's columns plus the actions its cards can run; every action refreshes the board. */
export function useStationBoard(tenantId: string | null, station: StationKey, view: BoardView = "active") {
  const { data, error, isLoading, mutate } = useSWR<StationBoard>(
    tenantId ? stationBoardKey(tenantId, station, view) : null,
    swrFetcher,
    { refreshInterval: BOARD_REFRESH_MS, revalidateOnFocus: true, keepPreviousData: true },
  );
  // The order id, or "order:item" while a single product line moves.
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(key: string, action: () => Promise<unknown>) {
    setBusyKey(key);
    setActionError(null);
    try {
      await action();
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    } finally {
      setBusyKey(null);
    }
  }

  return {
    board: data ?? null,
    loading: isLoading && !data,
    loadError: error && !isAbortError(error) ? (error instanceof Error ? error.message : "No se pudo cargar.") : null,
    actionError,
    busyKey,
    isBusy: (orderId: string) => busyKey === orderId || Boolean(busyKey?.startsWith(`${orderId}:`)),
    refresh: () => mutate(),
    advance: (orderId: string, status: FulfillmentStatus) =>
      run(orderId, () => advanceWholeOrderFulfillment(orderId, status)),
    advanceItem: (orderId: string, itemId: string, status: FulfillmentStatus) =>
      run(`${orderId}:${itemId}`, () => advanceOrderItemFulfillment(orderId, itemId, status)),
    assign: (orderId: string, userId: string) => run(orderId, () => updateOrder(orderId, { assigned_to: userId })),
    respondRequest: (orderId: string, action: "accept-request" | "reject-request") =>
      run(orderId, () => updatePublicOrderRequest(orderId, action)),
    deliveryEvent: (orderId: string, type: OrderDeliveryEventType, photo?: File, note?: string) =>
      run(orderId, () => createOrderDeliveryEvent(orderId, type, photo, note)),
  };
}

export type StationBoardController = ReturnType<typeof useStationBoard>;
