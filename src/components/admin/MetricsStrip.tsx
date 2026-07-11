import type { LucideIcon } from "lucide-react";

export type MetricTone = "default" | "emerald" | "amber" | "red" | "accent";

export interface Metric {
  label: string;
  value: string | number;
  tone?: MetricTone;
  icon?: LucideIcon;
  hint?: string;
}

interface MetricsStripProps {
  metrics: Metric[];
}

const TONE_VALUE: Record<MetricTone, string> = {
  default: "text-foreground",
  emerald: "text-emerald-700",
  amber: "text-amber-700",
  red: "text-red-700",
  accent: "text-accent",
};

const TONE_ICON: Record<MetricTone, string> = {
  default: "text-muted-foreground bg-border-soft/60",
  emerald: "text-emerald-700 bg-emerald-100",
  amber: "text-amber-700 bg-amber-100",
  red: "text-red-700 bg-red-100",
  accent: "text-accent bg-accent/10",
};

const GRID_BY_COUNT: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-3",
  4: "grid-cols-2 sm:grid-cols-4",
};

export function MetricsStrip({ metrics }: MetricsStripProps) {
  if (metrics.length === 0) return null;
  const gridClass = GRID_BY_COUNT[metrics.length] ?? "grid-cols-1 sm:grid-cols-3";
  return (
    <section
      className={`grid gap-3 rounded-2xl border border-border bg-surface p-4 ${gridClass}`}
    >
      {metrics.map((m) => {
        const tone = m.tone ?? "default";
        const Icon = m.icon;
        return (
          <div key={m.label} className="flex items-start gap-3">
            {Icon && (
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${TONE_ICON[tone]}`}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {m.label}
              </p>
              <p
                className={`mt-0.5 text-xl font-bold tabular-nums ${TONE_VALUE[tone]}`}
              >
                {m.value}
              </p>
              {m.hint && (
                <p className="text-[11px] text-muted-foreground">{m.hint}</p>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
