"use client";

import { ArrowRight, Loader2, PackageCheck, Undo2, Users } from "lucide-react";

import {
  adminActionButtonPrimary,
  adminActionButtonSecondary,
} from "@/components/admin/actionButtonClasses";
import { StatusBadge } from "@/components/admin/StatusBadge";

import type { AdminViewDevice } from "@/features/qr/services/tableAdminViewService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

interface PerPersonFulfillmentCardProps {
  devices: AdminViewDevice[];
  /** id of the device whose row is mid-request (null = none). */
  busyDeviceId: string | null;
  /** true while a whole-table action is running. */
  busyAll: boolean;
  onAdvanceDevice: (deviceId: string, status: FulfillmentStatus) => void;
  onAdvanceAll: (status: FulfillmentStatus) => void;
}

const STATUS_META: Record<
  string,
  { label: string; tone: "neutral" | "warning" | "success" }
> = {
  received: { label: "Recibido", tone: "neutral" },
  in_progress: { label: "En proceso", tone: "warning" },
  ready: { label: "Listo", tone: "success" },
};

/**
 * Staff control to advance preparation state PER PERSON. With N people at a
 * table, one person's items can be ready while another's aren't — so each
 * connected client gets its own row + advance buttons. A whole-table shortcut
 * covers the common "everything came out together" case in one tap.
 *
 * Neutral, multi-business copy (no kitchen wording). Buttons reuse the shared
 * admin action classes — no bespoke button styling.
 */
export function PerPersonFulfillmentCard({
  devices,
  busyDeviceId,
  busyAll,
  onAdvanceDevice,
  onAdvanceAll,
}: PerPersonFulfillmentCardProps) {
  const hasDevices = devices.length > 0;
  const allReady =
    hasDevices && devices.every((d) => d.fulfillment_status === "ready");

  return (
    <section className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <PackageCheck className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">
          Estado de preparación
        </h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Avanza el estado de cada cliente. Podrá pagar su parte cuando lo marques
        como listo.
      </p>

      {/* Whole-table shortcut */}
      {hasDevices && (
        <div className="mt-3 flex items-center justify-between gap-2 rounded-lg bg-border-soft/50 px-3 py-2">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            Toda la mesa
          </span>
          <div className="flex gap-2">
            {!allReady ? (
              <button
                type="button"
                onClick={() => onAdvanceAll("ready")}
                disabled={busyAll}
                className={adminActionButtonPrimary}
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
                disabled={busyAll}
                className={adminActionButtonSecondary}
              >
                <Undo2 className="h-4 w-4" />
                Regresar todo
              </button>
            )}
          </div>
        </div>
      )}

      {/* Per-person rows */}
      <div className="mt-3 space-y-2">
        {!hasDevices && (
          <p className="rounded-lg bg-border-soft/40 px-3 py-3 text-center text-xs text-muted-foreground">
            Aún no hay clientes conectados. En cuanto alguien escanee el QR
            aparecerá aquí para avanzar su pedido.
          </p>
        )}

        {devices.map((device) => {
          const status = device.fulfillment_status ?? "received";
          const meta = STATUS_META[status] ?? STATUS_META.received;
          const busy = busyDeviceId === device.id;
          return (
            <div
              key={device.id}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-2.5"
            >
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
              <StatusBadge tone={meta.tone} label={meta.label} />

              <div className="flex gap-1.5">
                {status === "received" && (
                  <button
                    type="button"
                    onClick={() => onAdvanceDevice(device.id, "in_progress")}
                    disabled={busy}
                    className={adminActionButtonPrimary}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                    Iniciar
                  </button>
                )}
                {status === "in_progress" && (
                  <>
                    <button
                      type="button"
                      onClick={() => onAdvanceDevice(device.id, "received")}
                      disabled={busy}
                      className={adminActionButtonSecondary}
                      aria-label="Regresar a recibido"
                    >
                      <Undo2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onAdvanceDevice(device.id, "ready")}
                      disabled={busy}
                      className={adminActionButtonPrimary}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <PackageCheck className="h-4 w-4" />
                      )}
                      Listo
                    </button>
                  </>
                )}
                {status === "ready" && (
                  <button
                    type="button"
                    onClick={() => onAdvanceDevice(device.id, "in_progress")}
                    disabled={busy}
                    className={adminActionButtonSecondary}
                  >
                    {busy ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Undo2 className="h-4 w-4" />
                    )}
                    Regresar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
