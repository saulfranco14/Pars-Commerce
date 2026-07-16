"use client";

import { CalendarDays, CheckCircle2, Clock3 } from "lucide-react";

import { useOrder } from "@/features/orders/hooks/useOrder";

function formatMXN(amount: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(amount);
}

export function OrderPaymentPlanCard() {
  const { order } = useOrder();
  if (!order) return null;

  const mode = order.payment_mode ?? "single";
  const schedules = order.payment_schedules ?? [];

  if (mode !== "partial" && mode !== "subscription") {
    return null;
  }

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Seguimiento de pagos
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Modo: {mode === "partial" ? "Abonos parciales" : "Suscripción"}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground">
          Pagado: {formatMXN(Number(order.paid_total ?? 0))}
        </div>
      </div>

      <div className="mt-2 text-xs text-muted-foreground">
        Pendiente: {formatMXN(Number(order.balance_due ?? 0))}
      </div>

      {schedules.length > 0 && (
        <div className="mt-4 space-y-2">
          {schedules
            .slice()
            .sort((a, b) => a.installment_number - b.installment_number)
            .map((schedule) => (
              <div
                key={schedule.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-surface px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">
                    Abono #{schedule.installment_number}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatMXN(Number(schedule.amount_due))} -{" "}
                    {new Date(schedule.due_date).toLocaleDateString("es-MX")}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    schedule.status === "paid"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {schedule.status === "paid" ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : schedule.status === "pending" ? (
                    <Clock3 className="h-3 w-3" />
                  ) : (
                    <CalendarDays className="h-3 w-3" />
                  )}
                  {schedule.status === "paid" ? "Pagado" : "Pendiente"}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

