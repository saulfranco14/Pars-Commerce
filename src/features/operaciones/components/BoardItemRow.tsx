"use client";

import { Check, Loader2, Package, Play } from "lucide-react";

import { btnWorkStepDone, btnWorkStepStart } from "@/components/ui/buttonClasses";

import type { BoardItemRowProps } from "@/features/operaciones/interfaces/boardComponents";

const NEXT_STEP = {
  received: { status: "in_progress", label: "Empezar", icon: Play, className: btnWorkStepStart },
  in_progress: { status: "ready", label: "Listo", icon: Check, className: btnWorkStepDone },
} as const;

/** One product line: photo, quantity and its own step, like a table in Mesas. */
export function BoardItemRow({ item, canAdvance, busy, locked, onAdvance }: BoardItemRowProps) {
  const done = item.status === "ready";
  const next = item.status === "ready" ? null : NEXT_STEP[item.status];

  return (
    <li className={`flex items-center gap-3 py-2 ${done ? "opacity-60" : ""}`}>
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-border-soft/50">
        {item.imageUrl ? (
          // Tenant Storage URLs come from any host; a native img avoids next/image allow-listing.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.imageUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
        ) : (
          <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
        {done && (
          <span className="absolute inset-0 flex items-center justify-center bg-emerald-600/70">
            <Check className="h-5 w-5 text-white" aria-hidden />
          </span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium text-foreground ${done ? "line-through" : ""}`}>
          <span className="font-bold tabular-nums">{item.quantity}×</span> {item.name}
        </p>
        <p
          className={`text-xs font-semibold ${
            done ? "text-emerald-600 dark:text-emerald-400" : item.status === "in_progress" ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
          }`}
        >
          {done ? "Listo" : item.status === "in_progress" ? "En proceso" : "Por empezar"}
        </p>
      </div>
      {next && canAdvance && (
        <button
          type="button"
          disabled={busy || locked}
          onClick={() => onAdvance(next.status)}
          aria-label={`${next.label}: ${item.name}`}
          className={next.className}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <next.icon className="h-4 w-4" aria-hidden />}
          {next.label}
        </button>
      )}
    </li>
  );
}
