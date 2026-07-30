"use client";

import { ArrowRight, RotateCcw } from "lucide-react";

import { useMesasDemo } from "@/features/landing/hooks/useMesasDemo";
import { PhoneFrame } from "@/features/landing/components/mesas/PhoneFrame";
import { MESAS_DEMO_SCREENS } from "@/features/landing/components/mesas/MesasPhoneScreens";

import { MESAS_DEMO_STEPS } from "@/features/landing/constants/mesas";

/**
 * The interactive core of the mesas section: a phone the visitor can actually
 * tap through, step by step, seeing the same screens their customer would see.
 *
 * Layout is mobile-first — phone, then the explanation, then the step rail
 * stacked underneath. From `lg` the rail moves to a column beside the phone so
 * the whole flow is legible at a glance on desktop.
 */
export function MesasDemoSimulator() {
  const { index, playing, containerRef, next, goTo, restart } = useMesasDemo({
    count: MESAS_DEMO_STEPS.length,
  });

  const step = MESAS_DEMO_STEPS[index];
  const Screen = MESAS_DEMO_SCREENS[step.key];
  const isLast = index === MESAS_DEMO_STEPS.length - 1;

  return (
    <div ref={containerRef} className="mt-12">
      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-center lg:gap-12">
        {/* ── Phone + narration ─────────────────────────────── */}
        <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-center lg:gap-10">
          <PhoneFrame screenKey={step.key}>
            <Screen />
          </PhoneFrame>

          <div className="max-w-md text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-accent">
              <step.icon className="h-3.5 w-3.5" aria-hidden />
              Paso {index + 1} de {MESAS_DEMO_STEPS.length}
            </span>
            <h3
              key={`${step.key}-title`}
              className="animate-fade-in-up mt-4 text-xl font-bold tracking-tight text-foreground sm:text-2xl"
            >
              {step.title}
            </h3>
            <p
              key={`${step.key}-desc`}
              className="animate-fade-in-up mt-3 text-[15px] leading-relaxed text-muted-foreground"
            >
              {step.description}
            </p>

            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row lg:justify-start sm:justify-center">
              {isLast ? (
                <button
                  type="button"
                  onClick={restart}
                  className="group inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/50 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Ver el flujo otra vez
                </button>
              ) : (
                <button
                  type="button"
                  onClick={next}
                  className="group inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background sm:w-auto"
                >
                  {step.action}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              )}
              {playing && (
                <span className="text-xs text-muted-foreground">
                  Avanza solo — o tócalo tú
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Step rail (tappable) ──────────────────────────── */}
        <ol className="mt-10 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:mt-0 lg:grid-cols-1">
          {MESAS_DEMO_STEPS.map((s, i) => {
            const active = i === index;
            const done = i < index;
            return (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={`flex w-full min-h-13 cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background ${
                    active
                      ? "border-accent bg-accent/5"
                      : "border-border bg-surface hover:border-accent/40"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold transition-colors ${
                      active || done
                        ? "bg-accent text-accent-foreground"
                        : "bg-border-soft text-muted-foreground dark:bg-border"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`truncate text-xs font-semibold ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
