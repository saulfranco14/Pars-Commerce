"use client";
import { Check } from "lucide-react";
import type { StudioPublishStepsProps } from "../../interfaces/ui";

const STEPS = [
  "Preparando la imagen",
  "Subiéndola",
  "Poniéndola en tu tienda",
] as const;

/** What is left before the ad is live, instead of one long «Preparando…». */
export function StudioPublishSteps({ phases }: StudioPublishStepsProps) {
  const drawn = phases.every((p) => p !== "drawing"),
    uploaded = phases.every((p) => p === "ready"),
    current = !drawn ? 0 : !uploaded ? 1 : 2;
  return (
    <ol className="space-y-3 py-2" aria-live="polite">
      {STEPS.map((label, i) => {
        const done = i < current,
          now = i === current;
        return (
          <li key={label} className="flex items-center gap-3 text-sm">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${done ? "bg-emerald-600 text-white" : now ? "bg-accent text-accent-foreground studio-pulse" : "bg-border-soft text-muted-foreground"}`}
            >
              {done ? <Check className="h-4 w-4" aria-hidden /> : i + 1}
            </span>
            <span
              className={`min-w-0 flex-1 font-semibold ${done ? "text-emerald-700 dark:text-emerald-400" : now ? "text-foreground" : "text-muted-foreground"}`}
            >
              {label}
            </span>
            <span
              className={`h-2 w-20 shrink-0 rounded-full ${done ? "bg-emerald-500/30" : now ? "studio-shimmer" : "bg-border-soft"}`}
              aria-hidden
            />
          </li>
        );
      })}
    </ol>
  );
}
