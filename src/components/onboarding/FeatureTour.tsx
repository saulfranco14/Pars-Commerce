"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";

import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";

import type { FeatureTourProps } from "@/types/featureTour";

/** Swipe distance that turns the page. */
const SWIPE_PX = 48;

/**
 * A short welcome shown once per person and device: a few screens, swipe or
 * Siguiente, Saltar on every screen but the last.
 */
export function FeatureTour({
  storageKey,
  label,
  slides,
  finishLabel,
  onFinish,
}: FeatureTourProps) {
  const [visible, setVisible] = useState(false),
    [current, setCurrent] = useState(0),
    touchX = useRef<number | null>(null),
    touchY = useRef<number | null>(null);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setVisible(true);
    } catch {
      /* storage blocked: skip the tour rather than show it every time */
    }
  }, [storageKey]);
  useBodyScrollLock(visible);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {
      /* storage blocked */
    }
    setVisible(false);
  }, [storageKey]);
  const isLast = current === slides.length - 1;
  const next = useCallback(() => {
    if (!isLast) return setCurrent((i) => i + 1);
    dismiss();
    onFinish?.();
  }, [isLast, dismiss, onFinish]);
  const prev = useCallback(() => setCurrent((i) => Math.max(0, i - 1)), []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, next, prev, dismiss]);

  if (!visible) return null;
  return (
    <div
      className="fixed inset-0 z-9999 flex flex-col overflow-hidden bg-background select-none"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      {!isLast && (
        <button
          type="button"
          onClick={dismiss}
          className="absolute right-4 z-10 flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-raised hover:text-foreground"
          style={{ top: "max(1rem, env(safe-area-inset-top, 1rem))" }}
        >
          Saltar <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
      <div
        className="flex-1 overflow-hidden"
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
          touchY.current = e.touches[0].clientY;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null || touchY.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current,
            dy = e.changedTouches[0].clientY - touchY.current;
          if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > SWIPE_PX) {
            if (dx < 0) next();
            else prev();
          }
          touchX.current = null;
          touchY.current = null;
        }}
      >
        <div
          className="flex h-full transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${slides.length * 100}%`,
            transform: `translateX(-${(current / slides.length) * 100}%)`,
          }}
        >
          {slides.map((slide, i) => (
            <section
              key={slide.id}
              aria-hidden={i !== current}
              className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10"
              style={{ width: `${100 / slides.length}%` }}
            >
              <div className="flex w-full max-w-xs justify-center">
                {slide.visual}
              </div>
              <div className="mt-7 max-w-xs text-center">
                <h2 className="text-3xl leading-tight font-bold tracking-tight text-balance text-foreground">
                  {slide.title}
                </h2>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                  {slide.description}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
      <div
        className="flex flex-col items-center gap-4 px-6 pt-4"
        style={{
          paddingBottom: "max(1.75rem, env(safe-area-inset-bottom, 1.75rem))",
        }}
      >
        <div
          className="flex items-center gap-2"
          role="tablist"
          aria-label="Avance"
        >
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Paso ${i + 1} de ${slides.length}`}
              onClick={() => setCurrent(i)}
              className={`h-2 cursor-pointer rounded-full transition-all duration-300 ${i === current ? "w-6 bg-accent" : "w-2 bg-border hover:bg-muted"}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={next}
          className="flex min-h-12 w-full max-w-sm cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-accent px-8 text-base font-semibold text-accent-foreground shadow-lg transition-transform active:scale-97"
        >
          {isLast ? finishLabel : "Siguiente"}
          <ArrowRight className="h-5 w-5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
