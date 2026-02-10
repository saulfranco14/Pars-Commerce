"use client";

interface SummaryData {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  pendingCommission: number;
  paidCommission: number;
}

interface VentasResumenProps {
  summary: SummaryData;
}

export function VentasResumen({ summary }: VentasResumenProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 sm:gap-4">
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-muted-foreground">Total vendido</p>
        <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
          ${summary.totalRevenue.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-muted-foreground">Costo total</p>
        <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
          ${summary.totalCost.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-muted-foreground">Ganancia bruta</p>
        <p className="mt-1.5 text-xl font-bold tabular-nums text-accent">
          ${summary.grossProfit.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Comisiones pendientes
        </p>
        <p className="mt-1.5 text-xl font-bold tabular-nums text-amber-700">
          ${summary.pendingCommission.toFixed(2)}
        </p>
      </div>
      <div className="rounded-xl border border-border bg-surface-raised p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Comisiones pagadas
        </p>
        <p className="mt-1.5 text-xl font-bold tabular-nums text-foreground">
          ${summary.paidCommission.toFixed(2)}
        </p>
      </div>
    </div>
  );
}
