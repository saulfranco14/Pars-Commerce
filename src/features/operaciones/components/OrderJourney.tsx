"use client";

import { Check } from "lucide-react";

import type { JourneyState } from "@/features/operaciones/interfaces/board";
import type { OrderJourneyProps } from "@/features/operaciones/interfaces/boardComponents";

const COLUMNS: Record<number, string> = { 3: "grid-cols-3", 4: "grid-cols-4" };

const DOT: Record<JourneyState, string> = {
  done: "border-accent bg-accent text-accent-foreground",
  now: "border-accent bg-surface ring-4 ring-accent/15",
  wait: "border-amber-500 bg-surface ring-4 ring-amber-500/15",
  todo: "border-border bg-surface",
};

const LABEL: Record<JourneyState, string> = {
  done: "text-muted-foreground",
  now: "text-foreground",
  wait: "text-amber-700 dark:text-amber-400",
  todo: "text-muted-foreground",
};

const STATE_WORD: Record<JourneyState, string> = {
  done: "hecho",
  now: "en curso",
  wait: "esperando",
  todo: "pendiente",
};

/** Where the whole order is, on one line: done, happening, waiting on someone else, or still ahead. */
export function OrderJourney({ steps }: OrderJourneyProps) {
  return (
    <ol aria-label="Recorrido del pedido" className={`grid ${COLUMNS[steps.length] ?? "grid-cols-4"}`}>
      {steps.map((step, index) => {
        const reached = step.state !== "todo";
        return (
          <li key={step.key} className="relative flex min-w-0 flex-col items-center gap-1 px-0.5 text-center">
            {index > 0 && (
              <span
                aria-hidden
                className={`absolute top-2 right-1/2 h-0.5 w-full ${reached ? "bg-accent" : "bg-border"}`}
              />
            )}
            <span className={`relative z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 ${DOT[step.state]}`}>
              {step.state === "done" && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
              {step.state === "now" && <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />}
              {step.state === "wait" && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />}
            </span>
            <span className={`text-[11px] font-bold leading-tight ${LABEL[step.state]}`}>
              {step.label}
              <span className="sr-only">: {STATE_WORD[step.state]}</span>
            </span>
            <span className="w-full truncate text-[10px] leading-tight text-muted-foreground">{step.detail}</span>
          </li>
        );
      })}
    </ol>
  );
}
