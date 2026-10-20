"use client";

import { useState } from "react";
import useSWR from "swr";

import { swrFetcher } from "@/lib/swrFetcher";
import { isAbortError } from "@/services/apiFetch";
import { update as updateOrder } from "@/services/ordersService";
import { advanceOrderFulfillment } from "@/features/orders/services/fulfillmentClientService";
import {
  createOrderDeliveryEvent,
  updatePublicOrderRequest,
} from "@/features/orders/services/orderActionService";
import { BOARD_REFRESH_MS } from "@/features/operaciones/constants/stations";
import { stationBoardKey } from "@/features/operaciones/helpers/boardKey";

import type { StationKey } from "@/features/operaciones/constants/stations";
import type { StationBoard } from "@/features/operaciones/interfaces/board";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";
import type { OrderDeliveryEventType } from "@/features/orders/services/orderActionService";

/** One station's columns plus the actions its cards can run; every action refreshes the board. */
export function useStationBoard(tenantId: string | null, station: StationKey) {
  const { data, error, isLoading, mutate } = useSWR<StationBoard>(
    tenantId ? stationBoardKey(tenantId, station) : null,
    swrFetcher,
    { refreshInterval: BOARD_REFRESH_MS, revalidateOnFocus: true, keepPreviousData: true },
  );
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function run(orderId: string, action: () => Promise<unknown>) {
    setBusyOrderId(orderId);
    setActionError(null);
    try {
      await action();
      await mutate();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "No se pudo actualizar el pedido.");
    } finally {
      setBusyOrderId(null);
    }
  }

  return {
    board: data ?? null,
    loading: isLoading && !data,
    loadError: error && !isAbortError(error) ? (error instanceof Error ? error.message : "No se pudo cargar.") : null,
    actionError,
    busyOrderId,
    refresh: () => mutate(),
    advance: (orderId: string, status: FulfillmentStatus) =>
      run(orderId, () => advanceOrderFulfillment(orderId, status)),
    assign: (orderId: string, userId: string) => run(orderId, () => updateOrder(orderId, { assigned_to: userId })),
    respondRequest: (orderId: string, action: "accept-request" | "reject-request") =>
      run(orderId, () => updatePublicOrderRequest(orderId, action)),
    deliveryEvent: (orderId: string, type: OrderDeliveryEventType, photo?: File, note?: string) =>
      run(orderId, () => createOrderDeliveryEvent(orderId, type, photo, note)),
  };
}

export type StationBoardController = ReturnType<typeof useStationBoard>;
