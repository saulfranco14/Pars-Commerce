import {
  Check,
  CheckCircle2,
  PackageCheck,
  PackageOpen,
  Store,
  Truck,
} from "lucide-react";

import type { OrderDeliveryEvent } from "@/features/orders/interfaces/orderDetail";

interface CommerceFulfillmentTrackerProps {
  fulfillmentMethod: "delivery" | "pickup" | null;
  fulfillmentStatus?: string | null;
  events?: OrderDeliveryEvent[];
  audience?: "customer" | "business";
}

const BASE_STEPS = [
  { key: "received", label: "Recibido", icon: PackageOpen },
  { key: "in_progress", label: "Preparando", icon: PackageCheck },
  { key: "ready", label: "Listo", icon: CheckCircle2 },
] as const;

export function CommerceFulfillmentTracker({
  fulfillmentMethod,
  fulfillmentStatus,
  events = [],
  audience = "customer",
}: CommerceFulfillmentTrackerProps) {
  const isDelivery = fulfillmentMethod === "delivery";
  const hasOutForDelivery = events.some(
    (event) => event.type === "out_for_delivery",
  );
  const hasCompleted = events.some((event) =>
    isDelivery
      ? event.type === "delivered"
      : event.type === "pickup_completed",
  );
  const steps = isDelivery
    ? [
        ...BASE_STEPS,
        { key: "out_for_delivery", label: "En camino", icon: Truck },
        { key: "delivered", label: "Entregado", icon: CheckCircle2 },
      ]
    : [
        ...BASE_STEPS,
        { key: "pickup_completed", label: "Entregado", icon: Store },
      ];

  let activeIndex = Math.max(
    0,
    BASE_STEPS.findIndex(
      (step) => step.key === (fulfillmentStatus ?? "received"),
    ),
  );
  if (hasOutForDelivery && isDelivery) activeIndex = 3;
  if (hasCompleted) activeIndex = steps.length - 1;

  const current = steps[activeIndex];
  const customerMessage = hasCompleted
      ? isDelivery
      ? "Tu pedido ya fue entregado. La evidencia queda protegida en este seguimiento."
      : "El negocio confirmó que te entregó el pedido en el punto de recolección."
    : hasOutForDelivery
      ? "Tu pedido salió del negocio y va en camino a la dirección indicada."
      : fulfillmentStatus === "ready"
        ? isDelivery
          ? "Tu pedido está listo y el siguiente paso es enviarlo a tu domicilio."
          : "Tu pedido está listo. Ya puedes pasar al punto de recolección."
        : fulfillmentStatus === "in_progress"
          ? "El negocio ya está preparando tus productos."
          : "El pago está confirmado y el negocio comenzará a preparar tu pedido.";
  const businessMessage = hasCompleted
      ? isDelivery
      ? "La entrega quedó cerrada y el cliente puede consultar la evidencia."
      : "La entrega al cliente quedó confirmada y el pedido está cerrado."
    : hasOutForDelivery
      ? "El cliente ya puede ver que su pedido va en camino."
      : fulfillmentStatus === "ready"
        ? isDelivery
          ? "El paquete está listo. El siguiente paso es marcar su salida."
          : "El pedido está listo. Confirma cuando el cliente se lo lleve."
        : fulfillmentStatus === "in_progress"
          ? "Termina la preparación y márcalo listo para continuar."
          : "El pago está confirmado. Empieza la preparación para avisar al cliente.";
  const message =
    audience === "business" ? businessMessage : customerMessage;

  return (
    <section className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.11em] text-blue-700">
            Avance del pedido
          </p>
          <h2 className="mt-0.5 text-base font-bold text-blue-950">
            {current.label}
          </h2>
          <p className="mt-1 text-sm leading-5 text-blue-900">{message}</p>
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-700 shadow-sm">
          <current.icon className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <ol
        className="mt-4 flex items-start"
        aria-label="Progreso de preparación y entrega"
      >
        {steps.map((step, index) => {
          const complete = index < activeIndex || hasCompleted;
          const active = index === activeIndex && !hasCompleted;
          return (
            <li key={step.key} className="relative min-w-0 flex-1 text-center">
              {index > 0 ? (
                <span
                  className={`absolute right-1/2 top-3 h-0.5 w-full ${
                    index <= activeIndex ? "bg-blue-600" : "bg-blue-200"
                  }`}
                  aria-hidden
                />
              ) : null}
              <span
                className={`relative z-10 mx-auto flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                  complete
                    ? "border-blue-600 bg-blue-600 text-white"
                    : active
                      ? "border-blue-600 bg-white text-blue-700"
                      : "border-blue-200 bg-white text-blue-300"
                }`}
                aria-current={active ? "step" : undefined}
              >
                {complete ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`mt-1.5 block truncate px-0.5 text-[9px] font-semibold sm:text-[10px] ${
                  index <= activeIndex ? "text-blue-950" : "text-blue-400"
                }`}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
