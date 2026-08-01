"use client";

import { Notification } from "@/components/ui/Notification";
import { PerPersonFulfillmentCard } from "@/features/qr/components/table/PerPersonFulfillmentCard";
import { useTableAdminLive } from "@/features/qr/hooks/useTableAdminLive";
import { useOrder } from "@/features/orders/hooks/useOrder";

/**
 * Kiosk orders use the same per-line fulfillment source of truth as a table.
 * They intentionally keep their own dashboard context: one ticket may stay
 * standalone, or later become the first person at a table.
 */
export function KioskFulfillmentCard() {
  const { order } = useOrder();
  const live = useTableAdminLive(order?.source === "kiosk" ? order.id : null);

  if (!order || order.source !== "kiosk") return null;
  const data = live.data;
  if (live.error && !data) {
    return <Notification tone="error" message={live.error} />;
  }
  if (!data) return null;

  const lockedDeviceIds = data.split_groups
    .filter(
      (group) =>
        group.device_id &&
        (group.payment_status === "pending_validation" ||
          group.payment_status === "paid"),
    )
    .map((group) => group.device_id!);
  const orderLabel =
    data.order?.id.slice(0, 8).toUpperCase() ?? order.id.slice(0, 8).toUpperCase();

  return (
    <div className="space-y-2">
      {live.error && <Notification tone="error" message={live.error} />}
      <PerPersonFulfillmentCard
        devices={data.devices}
        items={data.items}
        busyDeviceId={live.busyDeviceId}
        busyItemId={live.busyItemId}
        busyAll={live.advancing}
        lockedDeviceIds={lockedDeviceIds}
        sharedLabel={`Pedido de autoservicio · ${orderLabel}`}
        allScopeLabel="Pedido de autoservicio"
        description="Avanza cada producto o servicio. El ticket sigue mostrando estos cambios al cliente."
        onAdvanceDevice={live.advanceDevice}
        onAdvanceItem={live.advanceItem}
        onAdvanceAll={live.advanceAll}
      />
    </div>
  );
}
