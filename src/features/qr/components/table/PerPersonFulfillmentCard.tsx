"use client";

import { ArrowRight, Loader2, PackageCheck, Undo2, Users } from "lucide-react";

import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";

import type { AdminViewDevice, AdminViewItem } from "@/features/qr/services/tableAdminViewService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

interface PerPersonFulfillmentCardProps {
  devices: AdminViewDevice[];
  /** All order lines — filtered per device below (added_by_device_id). */
  items: AdminViewItem[];
  /** id of the device whose row is mid-request (null = none). */
  busyDeviceId: string | null;
  /** id of the order_item whose row is mid-request (null = none). */
  busyItemId: string | null;
  /** true while a whole-table action is running. */
  busyAll: boolean;
  onAdvanceDevice: (deviceId: string, status: FulfillmentStatus) => void;
  onAdvanceItem: (orderItemId: string, status: FulfillmentStatus) => void;
  onAdvanceAll: (status: FulfillmentStatus) => void;
}

/**
 * Staff control to advance preparation state PER PRODUCT LINE, grouped by
 * person. A single customer can order a fast item (a drink) and a slow one
 * (a service) in the same batch — one can be ready while the other isn't, so
 * each line gets its own status + advance buttons. The device's own status
 * (shown as a badge next to their name) is a DERIVED summary from its
 * lines — advancing a line updates it automatically via the DB trigger
 * cascade, no separate action needed for it. A whole-table shortcut still
 * covers the common "everything came out together" case in one tap.
 *
 * Neutral, multi-business copy (no kitchen wording). Buttons reuse the shared
 * admin action classes — no bespoke button styling.
 */
export function PerPersonFulfillmentCard({
  devices,
  items,
  busyDeviceId,
  busyItemId,
  busyAll,
  onAdvanceDevice,
  onAdvanceItem,
  onAdvanceAll,
}: PerPersonFulfillmentCardProps) {
  const hasDevices = devices.length > 0;
  const allReady =
    hasDevices && devices.every((d) => d.fulfillment_status === "ready");
  const actionsLocked =
    busyAll || busyDeviceId !== null || busyItemId !== null;

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Estado de preparación
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Avanza cada producto. Un cliente puede pagar su parte cuando TODOS sus
        productos estén listos.
      </p>

      {/* Whole-table shortcut */}
      {hasDevices && (
        <div className="mt-3 rounded-lg bg-border-soft/50 p-3">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Toda la mesa
          </span>
          <div className="mt-3">
            {!allReady ? (
              <button
                type="button"
                onClick={() => onAdvanceAll("ready")}
                disabled={actionsLocked}
                className={`${adminActionButtonPrimary} w-full justify-center`}
              >
                {busyAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                Marcar todo listo
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAdvanceAll("in_progress")}
                disabled={actionsLocked}
                className={`${adminActionButtonSecondary} w-full justify-center`}
              >
                <Undo2 className="h-4 w-4" />
                Regresar todo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Per-person groups, each expanded into its own product lines */}
      <div className="mt-3 space-y-3">
        {!hasDevices && (
          <p className="rounded-lg bg-border-soft/40 px-3 py-3 text-center text-xs text-muted-foreground">
            Aún no hay clientes conectados. En cuanto alguien escanee el QR
            aparecerá aquí para avanzar su pedido.
          </p>
        )}

        {devices.map((device) => {
          const deviceStatus = device.fulfillment_status ?? "received";
          const deviceMeta = getFulfillmentStatusMeta(deviceStatus);
          const deviceBusy = busyDeviceId === device.id;
          const deviceItems = items.filter(
            (item) => item.added_by_device_id === device.id,
          );

          return (
            <div
              key={device.id}
              className="rounded-xl border border-border px-3 py-2.5"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  aria-hidden
                  className="h-6 w-6 shrink-0 rounded-full"
                  style={{ backgroundColor: device.color_hex }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {device.display_name?.trim() || "Cliente"}
                  </p>
                </div>
                <StatusBadge tone={deviceMeta.tone} label={deviceMeta.label} />

                {deviceStatus === "ready" && (
                  <button
                    type="button"
                    onClick={() => onAdvanceDevice(device.id, "in_progress")}
                    disabled={actionsLocked || deviceBusy}
                    className={`${adminActionButtonSecondary} w-full justify-center sm:w-auto`}
                  >
                    {deviceBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4" />
                    )}
                    Regresar todo
                  </button>
                )}
              </div>

              {/* Product lines for this person */}
              <div className="mt-2 space-y-1.5 border-t border-border-soft pt-2">
                {deviceItems.length === 0 && (
                  <p className="px-1 text-xs text-muted-foreground">
                    Sin productos asignados.
                  </p>
                )}
                {deviceItems.map((item) => {
                  const itemStatus = item.fulfillment_status ?? "received";
                  const itemMeta = getFulfillmentStatusMeta(itemStatus);
                  const itemBusy = busyItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      className="flex flex-col items-stretch gap-2 rounded-lg bg-border-soft/30 px-2.5 py-2 sm:flex-row sm:items-center"
                    >
                      <p className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                        {item.quantity}× {item.product_name}
                      </p>
                      <StatusBadge tone={itemMeta.tone} label={itemMeta.label} compact />
                      <div className="flex w-full gap-1.5 sm:w-auto">
                        {itemStatus === "received" && (
                          <button
                            type="button"
                            onClick={() => onAdvanceItem(item.id, "in_progress")}
                            disabled={actionsLocked || itemBusy}
                            className={`${adminActionButtonPrimary} w-full justify-center`}
                          >
                            {itemBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                            Iniciar
                          </button>
                        )}
                        {itemStatus === "in_progress" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onAdvanceItem(item.id, "received")}
                              disabled={actionsLocked || itemBusy}
                              className={`${adminActionButtonSecondary} flex-1 justify-center sm:flex-none`}
                              aria-label="Regresar a recibido"
                            >
                              <Undo2 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onAdvanceItem(item.id, "ready")}
                              disabled={actionsLocked || itemBusy}
                              className={`${adminActionButtonPrimary} flex-1 justify-center sm:flex-none`}
                            >
                              {itemBusy ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <PackageCheck className="h-3.5 w-3.5" />
                              )}
                              Listo
                            </button>
                          </>
                        )}
                        {itemStatus === "ready" && (
                          <button
                            type="button"
                            onClick={() => onAdvanceItem(item.id, "in_progress")}
                            disabled={actionsLocked || itemBusy}
                            className={`${adminActionButtonSecondary} w-full justify-center`}
                          >
                            {itemBusy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Undo2 className="h-3.5 w-3.5" />
                            )}
                            Regresar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
