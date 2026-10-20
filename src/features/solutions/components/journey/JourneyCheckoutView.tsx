import { CheckCircle2, RotateCcw, WalletCards } from "lucide-react";

import { PAYMENT_METHODS } from "@/features/solutions/constants/solutionCapabilities";
import { formatPeso } from "@/features/solutions/helpers/solutionFormat";

import type { OrderStage, PaymentMethod } from "@/features/solutions/interfaces/solutionExperience";

export function JourneyCheckoutView({
  stage,
  total,
  cartCount,
  paymentMethod,
  setPaymentMethod,
  chargeOrder,
  resetJourney,
}: {
  stage: OrderStage;
  total: number;
  cartCount: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  chargeOrder: () => void;
  resetJourney: () => void;
}) {
  const paid = stage === "paid";
  const results = [
    { label: "Ticket", value: "#108" },
    { label: "Venta", value: formatPeso(total) },
    { label: "Cliente", value: "Guardado" },
    { label: "Stock", value: `−${cartCount}` },
  ];

  return (
    <div className="bg-background p-3 sm:p-5">
      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Cobro · pedido #108</p>
            <p className="mt-1 text-3xl font-bold text-foreground">{formatPeso(total)}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              paid ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-accent/10 text-accent"
            }`}
          >
            {paid ? "Pagado" : "Listo para cobrar"}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2" role="radiogroup" aria-label="Forma de pago">
          {PAYMENT_METHODS.map((method) => {
            const active = paymentMethod === method;
            return (
              <button
                key={method}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setPaymentMethod(method)}
                className={`min-h-14 cursor-pointer rounded-xl border px-1 text-xs font-semibold text-foreground ${
                  active ? "border-foreground bg-border-soft ring-1 ring-foreground dark:bg-border" : "border-border"
                }`}
              >
                {method}
              </button>
            );
          })}
        </div>

        {paid ? (
          <div className="mt-4">
            <p className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/8 p-3 font-bold text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" aria-hidden />
              La operación quedó cerrada
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {results.map((result) => (
                <div key={result.label} className="rounded-xl bg-border-soft p-3 dark:bg-border">
                  <p className="text-[11px] font-semibold text-muted-foreground">{result.label}</p>
                  <p className="mt-1 text-sm font-bold text-foreground">{result.value}</p>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={resetJourney}
              className="mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-border-soft"
            >
              <RotateCcw className="h-4 w-4" aria-hidden />
              Repetir recorrido
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={chargeOrder}
            className="mt-4 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-bold text-background"
          >
            <WalletCards className="h-4 w-4" aria-hidden />
            Confirmar cobro de {formatPeso(total)}
          </button>
        )}
      </div>
    </div>
  );
}
