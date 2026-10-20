"use client";

import { RefreshCw } from "lucide-react";

import { useNow } from "@/features/operaciones/hooks/useNow";

import type { CSSProperties } from "react";
import type { BoardRefreshButtonProps } from "@/features/operaciones/interfaces/boardComponents";

const RADIUS = 19;
const RING_LENGTH = 2 * Math.PI * RADIUS;

/**
 * The ring fills one full turn until the automatic refresh; while loading it
 * pulses and the icon spins. A CSS animation keeps the fill smooth.
 */
export function BoardRefreshButton({ refreshing, updatedAt, intervalMs, onRefresh }: BoardRefreshButtonProps) {
  const now = useNow(1000);
  const elapsed = updatedAt ? Math.min(intervalMs, Math.max(0, now - updatedAt)) : 0;
  const secondsLeft = Math.ceil((intervalMs - elapsed) / 1000);
  const label = refreshing ? "Actualizando…" : `Se actualiza solo en ${secondsLeft} s. Toca para actualizar ahora.`;
  const ringStyle = {
    "--ring-length": RING_LENGTH,
    animation: `board-countdown ${intervalMs}ms linear forwards`,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={refreshing}
      aria-label={label}
      title={label}
      className="group relative inline-flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-full bg-surface text-muted-foreground shadow-sm ring-1 ring-border transition-all duration-150 hover:text-foreground active:scale-95 disabled:cursor-wait sm:h-11 sm:w-11"
    >
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 44 44" aria-hidden>
        <circle cx="22" cy="22" r={RADIUS} fill="none" strokeWidth="3" className="stroke-border-soft" />
        {refreshing ? (
          <circle cx="22" cy="22" r={RADIUS} fill="none" strokeWidth="3" className="animate-pulse stroke-accent" />
        ) : (
          <circle
            key={updatedAt ?? 0}
            cx="22"
            cy="22"
            r={RADIUS}
            fill="none"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={RING_LENGTH}
            strokeDashoffset={RING_LENGTH}
            style={ringStyle}
            className="board-countdown-ring stroke-accent"
          />
        )}
      </svg>
      <RefreshCw
        className={`relative h-4.5 w-4.5 transition-transform duration-300 group-hover:rotate-45 ${
          refreshing ? "animate-spin text-accent" : ""
        }`}
        aria-hidden
      />
    </button>
  );
}
