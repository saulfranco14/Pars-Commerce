"use client";
import { ArrowLeft, ArrowRight } from "lucide-react";
import {
  STUDIO_EXAMPLES,
  STUDIO_WALKTHROUGH_STEPS,
} from "../../constants/marketing";
import { useStudioShowcase } from "../../hooks/useStudioShowcase";
import { StudioWalkthroughScene } from "./StudioWalkthroughScene";
import { studioViewTransition } from "../../helpers/marketingTransition";
import styles from "./studioMarketing.module.css";

export function StudioHomeShowcase() {
  const show = useStudioShowcase(STUDIO_EXAMPLES.length, 3, 6500, false);
  const example = STUDIO_EXAMPLES[show.index],
    step = STUDIO_WALKTHROUGH_STEPS[show.step];
  return (
    <div
      ref={show.container}
      {...show.interaction}
      className={`${styles.homeShowcase} min-w-0 rounded-2xl border border-white/15 p-3 sm:p-4`}
    >
      <div className="flex min-h-11 items-center px-1">
        <p className="text-xs font-semibold text-slate-300">
          De tu catálogo a tus redes
        </p>
      </div>
      <div
        className={`${styles.homeStage} flex h-[380px] items-center justify-center rounded-xl px-2`}
      >
        <StudioWalkthroughScene
          example={example}
          step={show.step}
          playing={show.running}
          reducedMotion={show.reducedMotion || show.manual}
        />
      </div>
      <div
        className="min-h-[78px] px-2 pb-3 pt-4"
        aria-live={show.enabled ? "off" : "polite"}
        aria-atomic="true"
      >
        <div className="flex items-center justify-between gap-3">
          <p className="text-base font-semibold text-white">
            {show.step + 1}. {step.title}
          </p>
          <button
            type="button"
            aria-label="Siguiente paso del recorrido"
            onClick={() =>
              studioViewTransition(() => show.goToStep((show.step + 1) % 3))
            }
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-blue-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <p className="mt-1 text-xs leading-5 text-slate-400">
          {step.description}
        </p>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-2">
        <button
          type="button"
          aria-label="Negocio anterior"
          onClick={() =>
            studioViewTransition(() => show.choose(show.index - 1))
          }
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
        </button>
        <span className="text-xs font-semibold text-blue-300">
          {example.sector}
        </span>
        <button
          type="button"
          aria-label="Siguiente negocio"
          onClick={() =>
            studioViewTransition(() => show.choose(show.index + 1))
          }
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white"
        >
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
      <p className="text-center text-[10px] leading-5 text-slate-400">
        Ejemplo ilustrativo · no publica ni consume Tlacos.
      </p>
    </div>
  );
}
