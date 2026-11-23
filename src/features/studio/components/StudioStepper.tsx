"use client";
import { Check } from "lucide-react";
import { STUDIO_STEPS } from "../constants/studio";
import type { StudioStep, StudioStepperProps } from "../interfaces/ui";

export function StudioStepper({
  step,
  onStep,
  compact = false,
}: StudioStepperProps) {
  if (compact)
    return (
      <ol
        aria-label={`Paso ${step} de ${STUDIO_STEPS.length}: ${STUDIO_STEPS[step - 1]}`}
        className="flex items-center gap-1"
      >
        {STUDIO_STEPS.map((label, i) => {
          const number = (i + 1) as StudioStep,
            done = step > number,
            current = step === number,
            dot = (
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${done || current ? "bg-accent text-accent-foreground" : "border-2 border-border bg-surface text-muted-foreground"}`}
              >
                {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : number}
              </span>
            );
          return (
            <li key={label} className="flex items-center gap-1">
              {i > 0 && (
                <span
                  aria-hidden
                  className={`h-0.5 w-3 ${step >= number ? "bg-accent" : "bg-border"}`}
                />
              )}
              {done && onStep && number > 1 ? (
                <button
                  type="button"
                  onClick={() => onStep(number)}
                  aria-label={`Volver a ${label}`}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                >
                  {dot}
                </button>
              ) : (
                dot
              )}
            </li>
          );
        })}
      </ol>
    );
  return (
    <nav
      aria-label="Pasos del anuncio"
      className="rounded-2xl border border-border bg-surface px-2 py-4"
    >
      <ol className="flex items-start">
        {STUDIO_STEPS.map((label, i) => {
          const number = (i + 1) as StudioStep,
            done = step > number,
            current = step === number,
            circle = (
              <span
                className={`relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  done || current
                    ? "bg-accent text-accent-foreground"
                    : "border-2 border-border bg-surface text-muted-foreground"
                } ${current ? "ring-4 ring-accent/20" : ""}`}
              >
                {done ? <Check className="h-4 w-4" aria-hidden /> : number}
              </span>
            );
          return (
            <li
              key={label}
              aria-current={current ? "step" : undefined}
              className="relative flex flex-1 flex-col items-center gap-2 text-center"
            >
              {i < STUDIO_STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`absolute top-4.5 left-1/2 h-0.5 w-full ${done ? "bg-accent" : "bg-border"}`}
                />
              )}
              {done && onStep && number > 1 ? (
                <button
                  type="button"
                  onClick={() => onStep(number)}
                  aria-label={`Volver a ${label}`}
                  className="cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {circle}
                </button>
              ) : (
                circle
              )}
              <span
                className={`px-1 text-xs leading-tight ${
                  current
                    ? "font-bold text-accent"
                    : done
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
