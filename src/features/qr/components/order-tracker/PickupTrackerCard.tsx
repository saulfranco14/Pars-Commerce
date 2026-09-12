"use client";

import { Check, Loader2 } from "lucide-react";

import {
  FULFILLMENT_STEPS,
  fulfillmentStepIndex,
} from "@/features/qr/constants/fulfillmentStatusMeta";

import type { PickupTrackerCardProps } from "@/features/qr/interfaces/pickupTracker";

function message(status: string, paid: boolean): string {
  if (status === "ready") {
    return paid
      ? "¡Tu pedido está listo! Pasa a recogerlo."
      : "Tu pedido está listo. Pásalo a recoger y a pagar.";
  }
  if (status === "in_progress") return "Ya están preparando tu pedido.";
  return paid
    ? "El negocio ya recibió tu pago y tu pedido."
    : "El negocio ya recibió tu pedido.";
}

/**
 * Dónde va el pedido, para el cliente que pagó por adelantado.
 *
 * No es el `OrderTrackerCard` de las mesas: ahí pagar cierra el viaje, porque el
 * cobro va al final. Aquí pagar es el PRINCIPIO — el cliente paga en la pantalla
 * y se va a esperar, así que los pasos los manda `fulfillment_status` y nada más.
 * Si esta tarjeta se colapsara al pagar, diría "listo" con el pedido sin empezar.
 */
export function PickupTrackerCard({
  fulfillmentStatus,
  orderStatus,
  orderNumber,
  loading = false,
}: PickupTrackerCardProps) {
  const currentIndex = fulfillmentStepIndex(fulfillmentStatus);
  const paid = orderStatus === "paid" || orderStatus === "completed";
  const isReady = fulfillmentStatus === "ready";

  return (
    <section
      className={`rounded-2xl border bg-surface p-4 shadow-sm ${
        isReady ? "border-emerald-400" : "border-border"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Tu pedido
          {loading && <Loader2 className="h-3 w-3 animate-spin" aria-hidden />}
        </span>
        {orderNumber && (
          <span className="font-mono text-base font-bold tracking-wider text-foreground">
            {orderNumber}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-center">
        {FULFILLMENT_STEPS.map((step, i) => {
          const done = i < currentIndex;
          const active = i === currentIndex;
          const Icon = step.icon;
          return (
            <div
              key={step.status}
              className={`flex items-center ${i > 0 ? "flex-1" : ""}`}
            >
              {i > 0 && (
                <span
                  aria-hidden
                  className={`mx-1.5 h-0.5 flex-1 rounded-full ${
                    i <= currentIndex ? "bg-accent" : "bg-border"
                  }`}
                />
              )}
              <div className="flex flex-col items-center gap-1">
                <span
                  className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                    done || (active && isReady)
                      ? "bg-accent text-accent-foreground"
                      : active
                        ? "bg-accent/15 text-accent"
                        : "bg-border-soft/60 text-muted-foreground"
                  }`}
                >
                  {active && !isReady && (
                    <span
                      aria-hidden
                      className="absolute inset-0 animate-ping rounded-full bg-accent/20"
                    />
                  )}
                  {done ? (
                    <Check className="h-4 w-4" aria-hidden />
                  ) : (
                    <Icon className="relative h-4 w-4" aria-hidden />
                  )}
                </span>
                <span
                  className={`whitespace-nowrap text-[10px] font-bold ${
                    i > currentIndex ? "text-muted-foreground" : "text-foreground"
                  }`}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <p
        className={`mt-3 text-center text-xs font-semibold ${
          isReady ? "text-emerald-700" : "text-muted-foreground"
        }`}
      >
        {message(fulfillmentStatus, paid)}
      </p>

      {!isReady && (
        <p className="mt-1 text-center text-[11px] text-muted-foreground">
          Esta pantalla se actualiza sola. No hace falta recargar.
        </p>
      )}
    </section>
  );
}
