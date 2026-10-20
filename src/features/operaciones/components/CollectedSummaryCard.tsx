"use client";

import { HandCoins } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { methodLabel } from "@/features/operaciones/helpers/methodLabel";

import type { CollectedSummaryCardProps } from "@/features/operaciones/interfaces/boardComponents";

/** Today's money at a glance: the total is the hero, methods and tips underneath. */
export function CollectedSummaryCard({ summary }: CollectedSummaryCardProps) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5" aria-label="Resumen de hoy">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cobrado hoy</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(summary.total)}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {summary.orders === 1 ? "1 pedido" : `${summary.orders} pedidos`}
          </p>
        </div>
        {summary.tips > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">
            <HandCoins className="h-5 w-5" aria-hidden />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider">Propinas</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(summary.tips)}</p>
            </div>
          </div>
        )}
      </div>
      {summary.byMethod.length > 0 && (
        <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {summary.byMethod.map((m) => (
            <li key={m.method} className="rounded-xl bg-border-soft/60 px-3 py-2">
              <p className="text-xs font-medium text-muted-foreground">{methodLabel(m.method)}</p>
              <p className="text-base font-bold tabular-nums text-foreground">{formatCurrency(m.amount)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
