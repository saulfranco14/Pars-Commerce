"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronDown, Loader2, PackageCheck, Undo2, Users } from "lucide-react";

import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { getFulfillmentStatusMeta } from "@/features/qr/constants/fulfillmentStatusMeta";

import type { AdminViewDevice, AdminViewItem } from "@/features/qr/services/tableAdminViewService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

const SHARED_ITEMS_KEY = "__table_shared_items__";

function itemSummary(items: AdminViewItem[]) {
  const counts = new Map<FulfillmentStatus, number>();
  for (const item of items) {
    const status = (item.fulfillment_status ?? "received") as FulfillmentStatus;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  const labels: Array<[FulfillmentStatus, string]> = [
    ["received", "recibido"],
    ["in_progress", "en proceso"],
    ["ready", "listo"],
  ];
  const stateLabel = labels
    .flatMap(([status, label]) => {
      const count = counts.get(status) ?? 0;
      return count ? [`${count} ${label}${count === 1 ? "" : "s"}`] : [];
    })
    .join(" · ");
  return `${items.length} producto${items.length === 1 ? "" : "s"}${stateLabel ? ` · ${stateLabel}` : ""}`;
}

function itemTypeLabel(item: AdminViewItem): string | null {
  if (item.product_type === "service") return "Servicio";
  if (item.product_type === "product") return "Producto";
  return null;
}

interface FulfillmentItemRowProps {
  item: AdminViewItem;
  actionsLocked: boolean;
  itemBusy: boolean;
  paymentLocked?: boolean;
  onAdvanceItem: (orderItemId: string, status: FulfillmentStatus) => void;
}

/**
 * A single, compact product action row. The status is information; only the
 * next possible action is a button. Keeping both in the same visual row avoids
 * turning every completed product into a full-width green block on mobile.
 */
function FulfillmentItemRow({
  item,
  actionsLocked,
  itemBusy,
  paymentLocked = false,
  onAdvanceItem,
}: FulfillmentItemRowProps) {
  const itemStatus = item.fulfillment_status ?? "received";
  const itemMeta = getFulfillmentStatusMeta(itemStatus);
  const disabled = actionsLocked || itemBusy || paymentLocked;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg bg-border-soft/30 px-2.5 py-2">
      <p className="min-w-0 basis-full truncate text-xs font-medium text-foreground sm:basis-auto sm:flex-1">
        {item.quantity}× {item.product_name}
      </p>
      {itemTypeLabel(item) && (
        <span className="rounded-full bg-border-soft/70 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
          {itemTypeLabel(item)}
        </span>
      )}
      <StatusBadge tone={itemMeta.tone} label={itemMeta.label} compact />
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        {itemStatus === "received" && (
          <button
            type="button"
            onClick={() => onAdvanceItem(item.id, "in_progress")}
            disabled={disabled}
            className={`${adminActionButtonPrimary} min-h-11 shrink-0 px-3`}
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
              disabled={disabled}
              className={`${adminActionButtonSecondary} min-h-11 min-w-11 px-0`}
              aria-label="Regresar a recibido"
            >
              <Undo2 className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onAdvanceItem(item.id, "ready")}
              disabled={disabled}
              className={`${adminActionButtonPrimary} min-h-11 shrink-0 px-3`}
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
            disabled={disabled}
            className={`${adminActionButtonSecondary} min-h-11 shrink-0 px-3`}
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
}

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
  /** A paid or validating split group can no longer be moved backwards. */
  lockedDeviceIds?: string[];
  /** Neutral label for lines not yet attached to a person. */
  sharedLabel?: string;
  /** The order scope shown by the one-tap fulfillment action. */
  allScopeLabel?: string;
  /** Copy changes by context: table vs. self-service ticket. */
  description?: string;
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
  lockedDeviceIds = [],
  sharedLabel = "Pedido para la mesa",
  allScopeLabel = "Toda la mesa",
  description = "Avanza cada producto. Un cliente puede pagar su parte cuando TODOS sus productos estén listos.",
  onAdvanceDevice,
  onAdvanceItem,
  onAdvanceAll,
}: PerPersonFulfillmentCardProps) {
  const [expandedDeviceIds, setExpandedDeviceIds] = useState<string[]>([]);
  const previousItemStates = useRef<Map<string, string> | null>(null);
  const hasDevices = devices.length > 0;
  const allReady =
    items.length > 0 &&
    items.every((item) => (item.fulfillment_status ?? "received") === "ready");
  const actionsLocked =
    busyAll || busyDeviceId !== null || busyItemId !== null;
  const hasPaymentLockedDevice = lockedDeviceIds.length > 0;
  const sharedItems = items.filter((item) => !item.added_by_device_id);

  function toggleDevice(deviceId: string) {
    setExpandedDeviceIds((current) =>
      current.includes(deviceId)
        ? current.filter((id) => id !== deviceId)
        : [...current, deviceId],
    );
  }

  // New lines and status updates open their exact accordion group. A staff
  // member sees what just arrived without sacrificing the compact mobile view.
  useEffect(() => {
    const nextStates = new Map(
      items.map((item) => [item.id, item.fulfillment_status ?? "received"]),
    );
    const previous = previousItemStates.current;
    const groupsToOpen = new Set<string>();

    for (const item of items) {
      const previousStatus = previous?.get(item.id);
      const currentStatus = item.fulfillment_status ?? "received";
      if (!previous ? currentStatus !== "ready" : previousStatus !== currentStatus) {
        groupsToOpen.add(item.added_by_device_id ?? SHARED_ITEMS_KEY);
      }
    }

    if (groupsToOpen.size > 0) {
      setExpandedDeviceIds((current) => Array.from(new Set([...current, ...groupsToOpen])));
    }
    previousItemStates.current = nextStates;
  }, [items]);

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Estado de preparación
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {description}
      </p>

      {/* Whole-table shortcut */}
      {items.length > 0 && (
        <div className="mt-3 rounded-lg bg-border-soft/50 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              {allScopeLabel}
            </span>
            {!allReady ? (
              <button
                type="button"
                onClick={() => onAdvanceAll("ready")}
                disabled={actionsLocked || hasPaymentLockedDevice}
                className={`${adminActionButtonPrimary} ml-auto min-h-11 w-auto shrink-0 px-3`}
              >
                {busyAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <PackageCheck className="h-4 w-4" />
                )}
                <span className="sm:hidden">Todo listo</span>
                <span className="hidden sm:inline">Marcar todo listo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onAdvanceAll("in_progress")}
                disabled={actionsLocked || hasPaymentLockedDevice}
                className={`${adminActionButtonSecondary} ml-auto min-h-11 w-auto shrink-0 px-3`}
              >
                <Undo2 className="h-4 w-4" />
                <span>Deshacer todo</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Per-person groups, each expanded into its own product lines */}
      <div className="mt-3 space-y-3">
        {!hasDevices && sharedItems.length === 0 && (
          <p className="rounded-lg bg-border-soft/40 px-3 py-3 text-center text-xs text-muted-foreground">
            Aún no hay clientes conectados. En cuanto alguien escanee el QR
            aparecerá aquí para avanzar su pedido.
          </p>
        )}

        {sharedItems.length > 0 && (
          <div className="rounded-xl border border-border px-3 py-2.5">
            <button
              type="button"
              onClick={() => toggleDevice(SHARED_ITEMS_KEY)}
              aria-expanded={expandedDeviceIds.includes(SHARED_ITEMS_KEY)}
              aria-controls="shared-table-items"
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                <Users className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1 text-sm font-semibold text-foreground">
                {sharedLabel}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                  expandedDeviceIds.includes(SHARED_ITEMS_KEY) ? "rotate-180" : ""
                }`}
              />
            </button>
            {!expandedDeviceIds.includes(SHARED_ITEMS_KEY) && (
              <p className="mt-1.5 pl-9 text-xs text-muted-foreground">
                {itemSummary(sharedItems)}
              </p>
            )}
            {expandedDeviceIds.includes(SHARED_ITEMS_KEY) && (
              <div id="shared-table-items" className="mt-2 space-y-1.5 border-t border-border-soft pt-2">
                {sharedItems.map((item) => (
                  <FulfillmentItemRow
                    key={item.id}
                    item={item}
                    actionsLocked={actionsLocked}
                    itemBusy={busyItemId === item.id}
                    onAdvanceItem={onAdvanceItem}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {devices.map((device) => {
          const deviceStatus = device.fulfillment_status ?? "received";
          const deviceMeta = getFulfillmentStatusMeta(deviceStatus);
          const deviceBusy = busyDeviceId === device.id;
          const devicePaymentLocked = lockedDeviceIds.includes(device.id);
          const expanded = expandedDeviceIds.includes(device.id);
          const deviceName = device.display_name?.trim() || "Cliente";
          const initials = deviceName
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join("")
            .toUpperCase();
          const deviceItems = items.filter(
            (item) => item.added_by_device_id === device.id,
          );

          return (
            <div
              key={device.id}
              className="rounded-xl border border-border px-3 py-2.5"
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => toggleDevice(device.id)}
                  aria-expanded={expanded}
                  aria-controls={`device-items-${device.id}`}
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                >
                  <span
                    aria-hidden
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ backgroundColor: device.color_hex }}
                  >
                    {initials}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                    <span className="sm:hidden">{deviceName.split(/\s+/)[0]}</span>
                    <span className="hidden sm:inline">{deviceName}</span>
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                      expanded ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <StatusBadge tone={deviceMeta.tone} label={deviceMeta.label} />
              </div>

              {!expanded && (
                <p className="mt-1.5 pl-9 text-xs text-muted-foreground">
                  {itemSummary(deviceItems)}
                </p>
              )}

              {deviceStatus === "ready" && expanded && (
                <div className="mt-2 flex justify-end border-t border-border-soft pt-2">
                  <button
                    type="button"
                    onClick={() => onAdvanceDevice(device.id, "in_progress")}
                    disabled={actionsLocked || deviceBusy || devicePaymentLocked}
                    className={`${adminActionButtonSecondary} min-h-10 w-auto shrink-0 px-3`}
                  >
                    {deviceBusy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4" />
                    )}
                    <span>Deshacer listo</span>
                  </button>
                </div>
              )}

              {/* Product lines for this person */}
              {expanded && (
              <div
                id={`device-items-${device.id}`}
                className="mt-2 space-y-1.5 border-t border-border-soft pt-2"
              >
                {deviceItems.length === 0 && (
                  <p className="px-1 text-xs text-muted-foreground">
                    Sin productos asignados.
                  </p>
                )}
                {deviceItems.map((item) => (
                  <FulfillmentItemRow
                    key={item.id}
                    item={item}
                    actionsLocked={actionsLocked}
                    itemBusy={busyItemId === item.id}
                    paymentLocked={devicePaymentLocked}
                    onAdvanceItem={onAdvanceItem}
                  />
                ))}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
