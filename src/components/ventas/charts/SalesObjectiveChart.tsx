"use client";

interface SalesObjectiveChartProps {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  salesObjective: number | null;
  monthlyRent: number;
  loading?: boolean;
}

export function SalesObjectiveChart({
  totalRevenue,
  totalCost,
  grossProfit,
  salesObjective,
  monthlyRent,
  loading,
}: SalesObjectiveChartProps) {
  if (loading) {
    return (
      <div className="min-h-[180px] rounded-xl border border-border bg-surface-raised p-4 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  const breakEvenRevenue = totalCost + monthlyRent;
  const rentCovered = grossProfit >= monthlyRent;
  const remainingToBreakEven = Math.max(0, breakEvenRevenue - totalRevenue);
  const profitAfterRent = grossProfit - monthlyRent;

  const hasObjective = salesObjective != null && salesObjective > 0;
  const objectivePercent = hasObjective
    ? Math.min(100, (totalRevenue / salesObjective) * 100)
    : null;

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-3 sm:p-4">
      <h3 className="text-sm font-medium text-foreground">Objetivo vs realizado</h3>

      <div className="mt-3 space-y-3">
        {hasObjective && (
          <div>
            <div className="flex justify-between gap-2 text-xs">
              <span className="text-muted-foreground">Realizado</span>
              <span className="font-medium tabular-nums text-foreground">
                ${totalRevenue.toFixed(2)} / ${salesObjective.toFixed(2)}
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-border-soft">
              <div
                className="h-full rounded-full bg-accent transition-all duration-500"
                style={{ width: `${objectivePercent ?? 0}%` }}
              />
            </div>
            <p className="mt-1 text-right text-xs tabular-nums text-muted-foreground">
              {objectivePercent?.toFixed(1)}%
            </p>
          </div>
        )}

        {monthlyRent > 0 ? (
          <div className="border-t border-border-soft pt-3">
            <p className="text-xs font-medium text-muted-foreground">Renta mensual</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-foreground">
              ${monthlyRent.toFixed(2)}
            </p>
            {rentCovered ? (
              <p className="mt-1.5 text-xs text-muted-foreground">
                Renta cubierta. Ganancia tras renta:{" "}
                <span className="font-medium text-accent">
                  ${profitAfterRent.toFixed(2)}
                </span>
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-amber-700">
                Tu ganancia bruta (${grossProfit.toFixed(2)}) no alcanza para la renta (${monthlyRent.toFixed(2)}). Vende{" "}
                <span className="font-semibold">${remainingToBreakEven.toFixed(2)}</span> más para cubrirla.
              </p>
            )}
          </div>
        ) : (
          !hasObjective && (
            <div className="border-t border-border-soft pt-3">
              <p className="text-xs text-muted-foreground">
                Configura objetivo y renta en Configuración para ver el avance.
              </p>
            </div>
          )
        )}

        {!hasObjective && monthlyRent === 0 && (
          <div className="pt-2">
            <p className="text-2xl font-bold tabular-nums text-foreground">
              ${totalRevenue.toFixed(2)}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">Total vendido en el período</p>
          </div>
        )}
      </div>
    </div>
  );
}
