import { ArrowRight, BellRing } from "lucide-react";

import { catalogItemKey, formatPeso } from "@/features/solutions/helpers/solutionFormat";

import type { CartLine, OrderStage } from "@/features/solutions/interfaces/solutionExperience";

const STAGE_LABEL: Partial<Record<OrderStage, string>> = {
  received: "Nuevo",
  preparing: "Preparando",
};

const NEXT_ACTION: Partial<Record<OrderStage, string>> = {
  received: "Aceptar pedido",
  preparing: "Marcar como listo",
};

export function JourneyOrdersView({
  stage,
  cartLines,
  cartCount,
  total,
  advanceOrder,
}: {
  stage: OrderStage;
  cartLines: CartLine[];
  cartCount: number;
  total: number;
  advanceOrder: () => void;
}) {
  const queue = [
    { id: "#106", customer: "María · 18:00", status: "Preparando", current: false },
    { id: "#107", customer: "Luis · domicilio", status: "Listo", current: false },
    { id: "#108", customer: "Cliente en línea", status: STAGE_LABEL[stage] ?? "Listo", current: true },
  ];

  return (
    <div className="min-h-98 bg-background p-3 sm:p-5">
      <div className="grid gap-2 sm:grid-cols-3">
        {queue.map((order) => (
          <div
            key={order.id}
            className={`rounded-2xl border bg-surface p-3 ${
              order.current ? "border-emerald-500/50 ring-2 ring-emerald-500/10" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-muted-foreground">{order.id}</span>
              {order.current && <BellRing className="h-4 w-4 text-emerald-500" aria-hidden />}
            </div>
            <p className="mt-2 truncate text-sm font-bold text-foreground">{order.customer}</p>
            <p className="mt-1 text-xs text-muted-foreground">{order.status}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-2xl border border-border bg-surface p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-accent">Pedido #108</p>
            <p className="mt-1 font-bold text-foreground">
              {cartCount} {cartCount === 1 ? "artículo" : "artículos"} · recoger a las 18:30
            </p>
          </div>
          <span className="text-xl font-bold text-foreground">{formatPeso(total)}</span>
        </div>
        <div className="mt-3 space-y-1">
          {cartLines.map(({ item, quantity }) => (
            <p key={catalogItemKey(item)} className="text-sm text-muted-foreground">
              {quantity} × {item.name}
            </p>
          ))}
        </div>
        <button
          type="button"
          onClick={advanceOrder}
          className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground hover:bg-accent-hover"
        >
          {NEXT_ACTION[stage] ?? "Ir a cobrar"}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
