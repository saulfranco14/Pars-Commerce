import { ArrowDown, Bell, Clock, Store } from "lucide-react";

import type { HeroBeat, HeroPanelData } from "@/features/landing/interfaces/heroDemo";

/** El panel en móvil: solo el aviso y la fila que cambió por lo que hizo el cliente. */
export function HeroPanelEcho({ beat, panel }: { beat: HeroBeat; panel: HeroPanelData }) {
  const row = panel.rows.find((r) => r.highlight) ?? panel.rows[0];
  const NoticeIcon = panel.notice.idle ? Clock : Bell;

  return (
    <div className="w-full max-w-80">
      <ArrowDown className="mx-auto my-1.5 h-4 w-4 text-accent" aria-hidden />

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3 py-2">
          <Store className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <span className="truncate text-[11px] font-bold text-foreground">
            Tu panel · {beat.panel.title}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5">
            <span className="animate-hero-live-pulse h-1 w-1 rounded-full bg-emerald-500" aria-hidden />
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">En vivo</span>
          </span>
        </div>

        <div className="space-y-2 p-3">
          <div
            key={panel.notice.text}
            className={`animate-hero-row-in flex items-center gap-1.5 rounded-lg border px-2 py-1.5 ${
              panel.notice.idle
                ? "border-border bg-surface-raised text-muted-foreground"
                : "border-accent/30 bg-accent/10 text-accent"
            }`}
          >
            <NoticeIcon className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate text-[11px] font-bold">{panel.notice.text}</span>
          </div>

          <div className="flex items-center justify-between gap-2 px-0.5">
            <span className="truncate text-[11px] font-semibold text-foreground">{row.left}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              <span
                key={row.middle}
                className="animate-hero-row-in rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground"
              >
                {row.middle}
              </span>
              <span className="text-[11px] font-bold tabular-nums text-foreground">{row.right}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
