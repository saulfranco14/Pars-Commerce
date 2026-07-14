"use client";

import { useCallback, useEffect, useState } from "react";

import {
  clearDeviceName,
  getDeviceName,
  getLastOrderId,
  getOrCreateFingerprint,
  setLastOrderId,
} from "@/features/qr/helpers/deviceFingerprint";
import {
  fetchTablePulse,
  resolveTableSession,
} from "@/features/qr/services/tableClientService";

import type { TableSessionResponse } from "@/features/qr/interfaces/tableSession";

/** How often the mesa screen checks for live changes (merge invites, closes). */
const PULSE_INTERVAL_MS = 10_000;

interface UseTableSessionResult {
  data: TableSessionResponse | null;
  fingerprint: string;
  initialDeviceName: string | null;
  error: string | null;
  isLoading: boolean;
  /** True when the order was paid/closed while the customer sat on the page. */
  ended: boolean;
  /** Full re-resolve (starts a fresh session — e.g. "Comenzar de nuevo"). */
  refresh: () => Promise<void>;
}

/**
 * Encapsulates everything required to bootstrap the customer's QR table view:
 *
 *  1. Generates / restores the per-token fingerprint from localStorage.
 *  2. Calls `/api/qr/resolve` with that fingerprint (heavy: menu + tenant +
 *     order/device creation) — ONCE per session, not on every tick.
 *  3. Detects "new session" — when the QR rolled to a fresh order_id since
 *     this device last visited — and clears the cached display_name so the
 *     previous customer's identity does not leak into the new order.
 *  4. Keeps the screen live via the READ-ONLY `/api/qr/table/pulse` heartbeat
 *     (10s, paused while the tab is hidden): merge invites, connected count,
 *     owner flag, and whether the order was closed. Polling resolve would be
 *     ~10 queries + the whole menu per tick AND would re-create orders after
 *     a close — the pulse is a handful of tiny reads with no side effects.
 *
 * Components only consume the returned shape — they never see fetch/init logic.
 */
export function useTableSession(token: string): UseTableSessionResult {
  const [data, setData] = useState<TableSessionResponse | null>(null);
  const [fingerprint, setFingerprint] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [ended, setEnded] = useState(false);

  // Shared by first load and manual refresh: apply the session-isolation
  // rules (never revive a previous customer's name on a fresh order).
  const applySession = useCallback(
    (body: TableSessionResponse) => {
      const currentOrderId = body.order?.id ?? null;
      const lastOrderId = getLastOrderId(token);
      const orderChanged =
        currentOrderId && lastOrderId && lastOrderId !== currentOrderId;
      if (body.is_new_session || orderChanged) {
        clearDeviceName(token);
      }
      if (currentOrderId) setLastOrderId(token, currentOrderId);
      setData(body);
      setEnded(false);
    },
    [token],
  );

  // First load: the one heavy resolve.
  useEffect(() => {
    if (!token) return;
    const fp = getOrCreateFingerprint(token);
    setFingerprint(fp);

    resolveTableSession({ token, fingerprint: fp })
      .then(applySession)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "No se pudo cargar la mesa.",
        );
      });
  }, [token, applySession]);

  // Lightweight heartbeat — only while the tab is visible.
  useEffect(() => {
    if (!token || !fingerprint || ended) return;
    const id = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetchTablePulse({ token, fingerprint })
        .then((pulse) => {
          setData((prev) => {
            if (!prev) return prev;

            // Order paid/closed (or QR freed) while sitting here → end the
            // session view instead of silently spinning up a new order.
            if (
              !pulse.active ||
              (pulse.order && prev.order && pulse.order.id !== prev.order.id)
            ) {
              setEnded(true);
              return prev;
            }

            return {
              ...prev,
              order:
                prev.order && pulse.order
                  ? {
                      ...prev.order,
                      status: pulse.order.status,
                      // Staff-controlled preparation state — this is what makes
                      // "Listo → ya puedes pagar" appear live instead of only
                      // after a manual reload. Previously dropped on the floor.
                      fulfillment_status:
                        pulse.order.fulfillment_status ??
                        prev.order.fulfillment_status,
                      my_fulfillment_status:
                        pulse.order.my_fulfillment_status ??
                        prev.order.my_fulfillment_status,
                      total: pulse.order.total ?? prev.order.total,
                      item_count:
                        pulse.order.item_count ?? prev.order.item_count,
                      ready_item_count:
                        pulse.order.ready_item_count ??
                        prev.order.ready_item_count,
                    }
                  : prev.order,
              connected_devices:
                pulse.connected_devices ?? prev.connected_devices,
              my_device: prev.my_device
                ? { ...prev.my_device, is_owner: pulse.i_am_owner === true }
                : prev.my_device,
              incoming_merge_request: pulse.incoming_merge_request ?? null,
              outgoing_merge_request: pulse.outgoing_merge_request ?? null,
            };
          });
        })
        .catch(() => {
          /* transient; keep last good data */
        });
    }, PULSE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [token, fingerprint, ended]);

  const refresh = async () => {
    if (!token || !fingerprint) return;
    try {
      const body = await resolveTableSession({ token, fingerprint });
      applySession(body);
    } catch {
      /* keep last good data */
    }
  };

  const storedName = data ? getDeviceName(token) : null;
  const initialDeviceName =
    data?.my_device?.display_name?.trim() || storedName || null;

  return {
    data,
    fingerprint,
    initialDeviceName,
    error,
    isLoading: !data && !error,
    ended,
    refresh,
  };
}
