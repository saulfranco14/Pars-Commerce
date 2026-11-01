"use client";

import useSWR from "swr";

import { PARA_DESIGNS, PARA_DESIGN_LABEL } from "@/features/growth/constants/paraDesigns";
import { paraDesignsKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { ParaDesignStats } from "@/features/growth/interfaces/para";

const percent = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : "—");

/** The three «Para ti» designs side by side: who stays, who reaches the store and who taps «Activar». */
export function ParaDesignStatsPanel() {
  const { data } = useSWR<ParaDesignStats[]>(paraDesignsKey, swrFetcher, { revalidateOnFocus: false });
  const byDesign = Object.fromEntries((data ?? []).map((row) => [row.design, row]));

  return (
    <section className="grid gap-3 rounded-2xl border border-border bg-surface p-4 sm:p-5" aria-label="Diseños de «Para ti»">
      <div className="grid gap-1">
        <h3 className="text-base font-bold text-foreground">Diseños de «Para ti»</h3>
        <p className="text-sm text-muted-foreground">
          A cada enlace le toca siempre uno de estos tres diseños. Cuenta solo a quien abrió su tienda desde el 1 de noviembre; con 30 visitas o más por diseño ya se puede elegir.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-xl text-left text-sm">
          <thead className="bg-surface-raised text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Diseño</th>
              <th className="px-3 py-2 text-right">Abrieron</th>
              <th className="px-3 py-2 text-right">Tiempo típico</th>
              <th className="px-3 py-2 text-right">Vieron su tienda</th>
              <th className="px-3 py-2 text-right">Tocaron «Activar»</th>
              <th className="px-3 py-2 text-right">Registrados</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft tabular-nums">
            {PARA_DESIGNS.map((design) => {
              const row = byDesign[design];
              return (
                <tr key={design}>
                  <td className="px-3 py-2">
                    <span className="block font-semibold text-foreground">{PARA_DESIGN_LABEL[design].label}</span>
                    <span className="block text-xs text-muted-foreground">{PARA_DESIGN_LABEL[design].why}</span>
                  </td>
                  <td className="px-3 py-2 text-right">{row?.visitors ?? 0}</td>
                  <td className="px-3 py-2 text-right">{row?.median_seconds ? `${row.median_seconds} s` : "—"}</td>
                  <td className="px-3 py-2 text-right">{row ? percent(row.reached_store, row.visitors) : "—"}</td>
                  <td className="px-3 py-2 text-right">{row ? `${row.claimed} · ${percent(row.claimed, row.visitors)}` : "—"}</td>
                  <td className="px-3 py-2 text-right">{row?.registered ?? 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
