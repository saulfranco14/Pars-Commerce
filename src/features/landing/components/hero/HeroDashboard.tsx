import {
  Banknote,
  BarChart3,
  Bell,
  Clock,
  Globe,
  Repeat,
  Table2,
  Wallet,
} from "lucide-react";

import type {
  HeroBeat,
  HeroPanelData,
  HeroPanelRow,
  HeroPanelView,
} from "@/features/landing/interfaces/heroDemo";

/**
 * La mitad del negocio en la demo del hero — el lado que la competencia nunca
 * muestra. Todos sus datos se derivan de lo que el cliente hace en el celular.
 */

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background px-2.5 py-2">
      <p className="truncate text-[10px] font-medium text-muted-foreground">
        {label}
      </p>
      <p
        key={value}
        className="animate-hero-row-in mt-0.5 text-sm font-bold tabular-nums text-foreground"
      >
        {value}
      </p>
    </div>
  );
}

/**
 * Fila de tabla del panel. La fila `highlight` es la que cambia por la acción
 * del cliente: tinte de acento SÓLIDO y borde izquierdo — con una opacidad muy
 * baja el tinte se lee gris y parece un bug.
 */
function Row({ left, middle, right, highlight = false }: HeroPanelRow) {
  const bg = highlight ? "bg-accent/10" : "bg-surface";
  return (
    <>
      <div
        className={`${bg} relative px-2.5 py-2 text-[11px] font-semibold text-foreground`}
      >
        {highlight && (
          <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" aria-hidden />
        )}
        {left}
      </div>
      <div className={`${bg} px-2.5 py-2`}>
        <span
          key={middle}
          className={`inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-bold ${
            highlight
              ? "animate-hero-row-in bg-accent text-accent-foreground"
              : "bg-border-soft text-muted-foreground dark:bg-border"
          }`}
        >
          {middle}
        </span>
      </div>
      <div
        key={right}
        className={`${bg} ${highlight ? "animate-hero-row-in" : ""} px-2.5 py-2 text-right text-[11px] font-bold tabular-nums text-foreground`}
      >
        {right}
      </div>
    </>
  );
}

/** Ícono por módulo — refuerza que cambió de pantalla, como en el Sidebar. */
const PANEL_ICON: Record<HeroPanelView, typeof Table2> = {
  tables: Table2,
  orders: BarChart3,
  subscriptions: Repeat,
  loans: Banknote,
  site: Globe,
  money: Wallet,
};

export function HeroDashboard({
  beat,
  panel,
}: {
  beat: HeroBeat;
  panel: HeroPanelData;
}) {
  const Icon = PANEL_ICON[beat.panel.view];
  const NoticeIcon = panel.notice.idle ? Clock : Bell;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-3 py-2.5">
        <span className="h-2 w-2 rounded-full bg-red-400/70" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-yellow-400/70" aria-hidden />
        <span className="h-2 w-2 rounded-full bg-green-400/70" aria-hidden />
        <div className="ml-2 flex min-w-0 items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
          <span
            key={`${beat.key}-title`}
            className="animate-fade-in-up truncate text-[11px] font-semibold text-foreground"
          >
            Mi Negocio · {beat.panel.title}
          </span>
        </div>
        <span className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5">
          <span
            className="animate-hero-live-pulse h-1.5 w-1.5 rounded-full bg-emerald-500"
            aria-hidden
          />
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            En vivo
          </span>
        </span>
      </div>

      <div className="space-y-2.5 p-3">
        <div
          key={panel.notice.text}
          className={`animate-hero-row-in flex h-7.5 items-center gap-1.5 rounded-lg border px-2.5 ${
            panel.notice.idle
              ? "border-border bg-surface-raised text-muted-foreground"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          <NoticeIcon className="h-3 w-3 shrink-0" aria-hidden />
          <span className="truncate text-[10px] font-bold">{panel.notice.text}</span>
        </div>

        <div key={beat.panel.view} className="animate-fade-in-up space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            {panel.metrics.map((m) => (
              <Metric key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <div className="overflow-hidden rounded-lg border border-border">
            <div className="grid grid-cols-[1fr_auto_auto] gap-px bg-border">
              {panel.headers.map((h, i) => (
                <div
                  key={h}
                  className={`bg-surface-raised px-2.5 py-1.5 text-[10px] font-semibold text-muted-foreground ${
                    i === 2 ? "text-right" : ""
                  }`}
                >
                  {h}
                </div>
              ))}
              {panel.rows.map((row) => (
                <Row key={row.left} {...row} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
