"use client";

import useSWR from "swr";
import { Trophy } from "lucide-react";

import { StatusBadge } from "@/components/admin/StatusBadge";

import { VARIANT_MIN_SAMPLE, winningVariant } from "@/features/growth/helpers/pickVariant";
import { variantStatsKey } from "@/features/growth/services/growthClient";
import { swrFetcher } from "@/lib/swrFetcher";

import type { TemplateStep, VariantStats } from "@/features/growth/interfaces/template";

const percent = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : "—");

/** How each variant of a step is doing, so the operator sees which one the sweep favors and why. */
export function VariantStatsPanel({ step }: { step: TemplateStep }) {
  const { data } = useSWR<VariantStats[]>(variantStatsKey(step), swrFetcher, { revalidateOnFocus: false });
  const rows = data ?? [];
  if (!rows.length) return <p className="text-xs text-muted-foreground">Todavía no hay envíos de este paso para comparar versiones.</p>;

  const stats = Object.fromEntries(rows.map((row) => [row.variant, row]));
  const winner = winningVariant(rows.map((row) => row.variant), stats);

  return (
    <div className="grid gap-2">
      <p className="text-xs text-muted-foreground">
        {winner
          ? `La ${winner} es la que más gente lleva a abrir su tienda: el barrido se la manda a 7 de cada 10 negocios y sigue probando las demás.`
          : `Cada versión necesita ${VARIANT_MIN_SAMPLE} envíos antes de elegir la mejor; mientras, el barrido reparte primero las que van atrás.`}
      </p>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-md text-left text-sm">
          <thead className="bg-surface-raised text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Versión</th>
              <th className="px-3 py-2 text-right">Enviados</th>
              <th className="px-3 py-2 text-right">Abrieron su tienda</th>
              <th className="px-3 py-2 text-right">Respondieron</th>
              <th className="px-3 py-2 text-right">Activaron</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-soft tabular-nums">
            {rows.map((row) => (
              <tr key={row.variant}>
                <td className="px-3 py-2 font-semibold text-foreground">
                  <span className="inline-flex items-center gap-2">
                    {row.variant}
                    {row.variant === winner ? <StatusBadge tone="success" label="Gana" compact dot={false} /> : null}
                    {row.variant === winner ? <Trophy className="h-3.5 w-3.5 text-emerald-600" aria-hidden /> : null}
                    {row.sent < VARIANT_MIN_SAMPLE ? <span className="text-xs font-normal text-muted-foreground">faltan {VARIANT_MIN_SAMPLE - row.sent}</span> : null}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">{row.sent}</td>
                <td className="px-3 py-2 text-right">{row.opened} · {percent(row.opened, row.sent)}</td>
                <td className="px-3 py-2 text-right">{row.replied} · {percent(row.replied, row.sent)}</td>
                <td className="px-3 py-2 text-right">{row.claimed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
