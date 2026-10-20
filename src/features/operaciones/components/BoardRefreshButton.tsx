"use client";

import { RefreshCw } from "lucide-react";

import { useNow } from "@/features/operaciones/hooks/useNow";

import type { BoardRefreshButtonProps } from "@/features/operaciones/interfaces/boardComponents";

const RADIUS = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** The ring fills until the next automatic refresh; the icon spins while it loads. */
export function BoardRefreshButton({ refreshing, updatedAt, intervalMs, onRefresh }: BoardRefreshButtonProps) {
  const now = useNow(1000);
  const elapsed = updatedAt ? Math.min(intervalMs, Math.max(0, now - updatedAt)) : 0;
  const secondsLeft = Math.ceil((intervalMs - elapsed) / 1000);
  const label = refreshing
    ? "Actualizando…"
    : `Se actualiza solo en ${secondsLeft} s. Toca para actualizar ahora.`;

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={label}
      title={label}
      className="relative inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-foreground disabled:cursor-wait"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={RADIUS} fill="none" strokeWidth="2" className="stroke-border-soft" />
        <circle
          cx="22"
          cy="22"
          r={RADIUS}
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - elapsed / intervalMs)}
          className="stroke-accent transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <RefreshCw className={`relative h-4 w-4 ${refreshing ? "animate-spin text-accent" : ""}`} aria-hidden />
    </button>
  );
}
