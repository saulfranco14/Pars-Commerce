"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchTableBill } from "@/features/qr/services/tableClientService";

import type { BillDevice, BillItem } from "@/features/qr/hooks/useBillData";

interface UseOrderTrackerParams {
  orderId: string | null;
  fingerprint: string;
  /** The order total known at session start — >0 means items already exist. */
  initialTotal: number;
}

interface UseOrderTrackerResult {
  /** Items already sent to the business (null until first load). */
  items: BillItem[] | null;
  devices: BillDevice[];
  total: number;
  myDeviceId: string | null;
  /** Staff-controlled preparation state: received | in_progress | ready. */
  fulfillmentStatus: string;
  loading: boolean;
  /** Re-read the bill — call after sending a new batch of items. */
  reload: () => Promise<void>;
}

/**
 * Feeds the "Tu pedido" tracker on the mesa screen WITHOUT adding another
 * polling loop (the pulse heartbeat already covers liveness). The bill is
 * read on demand only:
 *   - once on mount, when the session says the order already has a total
 *     (returning customer / page reload), and
 *   - after each successful send (the component calls `reload`).
 */
export function useOrderTracker({
  orderId,
  fingerprint,
  initialTotal,
}: UseOrderTrackerParams): UseOrderTrackerResult {
  const [items, setItems] = useState<BillItem[] | null>(null);
  const [devices, setDevices] = useState<BillDevice[]>([]);
  const [total, setTotal] = useState(initialTotal);
  const [myDeviceId, setMyDeviceId] = useState<string | null>(null);
  const [fulfillmentStatus, setFulfillmentStatus] = useState("received");
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!orderId || !fingerprint) return;
    setLoading(true);
    try {
      const bill = await fetchTableBill({ orderId, fingerprint });
      setItems(bill.items);
      setDevices(bill.devices);
      setTotal(Number(bill.order.total));
      setMyDeviceId(bill.my_device_id);
      setFulfillmentStatus(bill.order.fulfillment_status ?? "received");
    } catch {
      /* transient; keep whatever we had */
    } finally {
      setLoading(false);
    }
  }, [orderId, fingerprint]);

  // Hydrate once on mount when there's already an order in progress.
  useEffect(() => {
    if (orderId && fingerprint && initialTotal > 0 && items === null) {
      void reload();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, fingerprint, initialTotal]);

  return {
    items,
    devices,
    total,
    myDeviceId,
    fulfillmentStatus,
    loading,
    reload,
  };
}
