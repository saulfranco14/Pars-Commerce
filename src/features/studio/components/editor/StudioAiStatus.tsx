"use client";
import { useEffect, useState } from "react";
import { Check, Loader2, Undo2 } from "lucide-react";
import {
  STUDIO_AD_AI_TEXT,
  STUDIO_BATCH_IMAGE_ESTIMATE_MS,
} from "../../constants/studio";
import type { StudioAiStatusProps } from "../../interfaces/ui";

const TICK_MS = 400;
/** The bar never reaches the end on time alone; only the real image finishes it. */
const CAP = 0.92;

/** What the AI is doing under the ad, or the way back once its image landed. */
export function StudioAiStatus({
  running,
  landed,
  onUndo,
}: StudioAiStatusProps) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setNow(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, [running]);
  if (running) {
    const share = Math.min(
      CAP,
      (now - running.startedAt) / STUDIO_BATCH_IMAGE_ESTIMATE_MS,
    );
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-accent/25 bg-accent/5 px-3 py-2.5 text-sm font-semibold"
      >
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-accent"
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          {STUDIO_AD_AI_TEXT[running.kind]}
        </span>
        <span className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-accent/15">
          <span
            className="block h-full rounded-full bg-accent transition-[width] duration-300"
            style={{ width: `${Math.max(0.06, share) * 100}%` }}
          />
        </span>
      </div>
    );
  }
  if (!landed) return null;
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-3 py-1.5 text-sm font-semibold"
    >
      <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
      <span className="min-w-0 flex-1">Imagen nueva lista</span>
      <button
        type="button"
        onClick={onUndo}
        className="inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-2 font-bold text-accent focus-visible:outline-2 focus-visible:outline-accent"
      >
        <Undo2 className="h-4 w-4" aria-hidden />
        Deshacer
      </button>
    </div>
  );
}
