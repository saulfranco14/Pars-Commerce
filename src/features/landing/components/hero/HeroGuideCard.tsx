import { ArrowRight, CircleCheck, Pointer } from "lucide-react";

import type { HeroGuide } from "@/features/landing/interfaces/heroDemo";

/**
 * Una sola línea: qué tocar y, en cuanto pasa, qué ganó el negocio. Es todo el
 * texto que la demo necesita; lo demás lo cuentan el celular y el panel.
 */
export function HeroGuideCard({
  beatKey,
  guide,
  done,
  nextLabel,
  onNext,
}: {
  beatKey: string;
  guide: HeroGuide;
  done: boolean;
  nextLabel: string;
  onNext: () => void;
}) {
  if (done) {
    return (
      <div
        key={`${beatKey}-done`}
        className="animate-hero-row-in flex min-h-12 items-center gap-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/8 px-3 py-2"
        aria-live="polite"
      >
        <CircleCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
        <p className="min-w-0 flex-1 text-[13px] font-semibold leading-snug text-foreground">
          {guide.done}
        </p>
        <button
          type="button"
          onClick={onNext}
          aria-label={`Siguiente: ${nextLabel}`}
          className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 text-xs font-bold text-accent transition-colors hover:bg-accent/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          <span className="hidden sm:inline">{nextLabel}</span>
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <div
      key={`${beatKey}-pending`}
      className="animate-hero-row-in flex min-h-12 items-center gap-2.5 rounded-xl border border-accent/25 bg-accent/6 px-3 py-2"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <Pointer className="h-3 w-3" aria-hidden />
      </span>
      <p className="min-w-0 flex-1 text-[13px] leading-snug text-foreground">
        <span className="font-bold text-accent">Pruébalo: </span>
        {guide.hint}
      </p>
    </div>
  );
}
