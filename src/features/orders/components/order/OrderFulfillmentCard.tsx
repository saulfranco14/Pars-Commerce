"use client";

import { useState } from "react";
import { Check, Loader2, PackageCheck, Undo2 } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { FULFILLMENT_STEPS } from "@/features/qr/constants/fulfillmentStatusMeta";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { advanceOrderFulfillment } from "@/features/orders/services/fulfillmentClientService";
import { usePermission } from "@/stores/useTenantStore";

import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

/** Solo el verbo del botón es de aquí; el orden y las etiquetas son compartidos. */
const ADVANCE_LABEL: Record<string, string> = {
  received: "Regresar a recibido",
  in_progress: "Empezar",
  ready: "Marcar listo",
};

const STEPS = FULFILLMENT_STEPS.map((step) => ({
  ...step,
  status: step.status as FulfillmentStatus,
  advanceLabel: ADVANCE_LABEL[step.status] ?? step.label,
}));

/** Orígenes donde el cliente se va con un número y el trabajo queda pendiente. */
const TRACKED_SOURCES = new Set(["kiosk", "staff", "qr_table"]);

/**
 * Avance del trabajo, aparte del cobro.
 *
 * Existe porque el cobro y el trabajo son dos ejes distintos: en autoservicio el
 * cliente paga por adelantado (como en Rappi), así que el pedido queda `paid` con
 * el trabajo todavía sin empezar. Si el avance viviera colgado de `status`, un
 * pedido pagado no tendría forma de marcarse como hecho.
 */
export function OrderFulfillmentCard() {
  const { order, fetchOrder } = useOrder();
  const can = usePermission();
  const [busy, setBusy] = useState<FulfillmentStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;
  if (!TRACKED_SOURCES.has(order.source ?? "")) return null;
  if (order.status === "cancelled") return null;

  const current = (order.fulfillment_status ?? "received") as FulfillmentStatus;
  const currentIndex = STEPS.findIndex((s) => s.status === current);
  const canAdvance = can("qr.fulfill");

  async function advance(status: FulfillmentStatus) {
    setBusy(status);
    setError(null);
    try {
      await advanceOrderFulfillment(order!.id, status);
      await fetchOrder();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo cambiar el estado",
      );
    } finally {
      setBusy(null);
    }
  }

  const next = STEPS[currentIndex + 1];
  const previous = currentIndex > 0 ? STEPS[currentIndex - 1] : null;
  const isPaid = order.status === "paid" || order.status === "completed";

  return (
    <div className="min-w-0 rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-center gap-2">
        <PackageCheck
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
        <h3 className="text-sm font-semibold text-foreground">
          Estado del trabajo
        </h3>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {isPaid && current !== "ready"
          ? "El cliente ya pagó y su pedido sigue pendiente. Avánzalo aquí."
          : "Va aparte del cobro: un pedido pagado puede seguir sin hacerse."}
      </p>

      {error && (
        <div className="mt-3">
          <Notification tone="error" message={error} />
        </div>
      )}

      {/* Los tres pasos, con el actual marcado. Se ve completo aunque el rol no
          pueda avanzarlo: saber en qué va no requiere permiso. */}
      <ol className="mt-3 flex items-center gap-1.5">
        {STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          return (
            <li key={step.status} className="flex min-w-0 flex-1 items-center">
              <div
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 rounded-lg px-2 py-2 text-center ${
                  active
                    ? "bg-accent/10 ring-1 ring-accent/40"
                    : done
                      ? "bg-emerald-50"
                      : "bg-border-soft/40"
                }`}
              >
                {done ? (
                  <Check
                    className="h-4 w-4 shrink-0 text-emerald-600"
                    aria-hidden
                  />
                ) : (
                  <step.icon
                    className={`h-4 w-4 shrink-0 ${
                      active ? "text-accent" : "text-muted-foreground"
                    }`}
                    aria-hidden
                  />
                )}
                <span
                  className={`truncate text-xs font-semibold ${
                    active
                      ? "text-accent"
                      : done
                        ? "text-emerald-700"
                        : "text-muted-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {canAdvance ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {next && (
            <button
              type="button"
              onClick={() => advance(next.status)}
              disabled={busy !== null}
              className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60 sm:flex-none"
            >
              {busy === next.status ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
              ) : (
                <next.icon className="h-4 w-4 shrink-0" aria-hidden />
              )}
              {next.advanceLabel}
            </button>
          )}
          {previous && (
            <button
              type="button"
              onClick={() => advance(previous.status)}
              disabled={busy !== null}
              className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-60"
            >
              <Undo2 className="h-4 w-4 shrink-0" aria-hidden />
              Regresar a {previous.label.toLowerCase()}
            </button>
          )}
        </div>
      ) : (
        <p className="mt-3 rounded-lg bg-border-soft/50 px-3 py-2 text-xs text-muted-foreground">
          Tu rol no puede cambiar el estado del trabajo. Lo hacen el propietario y
          los meseros.
        </p>
      )}
    </div>
  );
}
