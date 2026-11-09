"use client";
import { useId, useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ImagePlus,
  Layers3,
  Pause,
  Play,
  Type,
} from "lucide-react";
import { track } from "@vercel/analytics";
import {
  STUDIO_EXAMPLES,
  STUDIO_WALKTHROUGH_STEPS,
} from "../../constants/marketing";
import { useStudioShowcase } from "../../hooks/useStudioShowcase";
import { StudioWordmark } from "./StudioWordmark";
import { StudioWalkthroughScene } from "./StudioWalkthroughScene";
import { studioViewTransition } from "../../helpers/marketingTransition";
import styles from "./studioMarketing.module.css";

const FORMATS = [
  { value: "portrait", label: "Publicación", ratio: "4:5" },
  { value: "square", label: "Cuadrado", ratio: "1:1" },
  { value: "story", label: "Historia", ratio: "9:16" },
] as const;
export function StudioEditorPreview() {
  const show = useStudioShowcase(STUDIO_EXAMPLES.length, 3, 6500, false);
  const [format, setFormat] =
    useState<(typeof FORMATS)[number]["value"]>("portrait");
  const sectorId = useId();
  const example = STUDIO_EXAMPLES[show.index],
    step = STUDIO_WALKTHROUGH_STEPS[show.step];
  function chooseExample(next: number) {
    studioViewTransition(() => {
      show.choose(next);
      setFormat("portrait");
    });
    try {
      track("studio_example_view", {
        location: "hero_walkthrough",
        example: STUDIO_EXAMPLES[next].id,
      });
    } catch {
      /* Best effort. */
    }
  }
  return (
    <div
      className={styles.workbench}
      id="vista-del-editor"
      ref={show.container}
      {...show.interaction}
      data-playing={show.running}
    >
      <div className="mx-auto max-w-5xl px-3 sm:px-8">
        <div className={styles.editor}>
          <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4 sm:px-5">
            <StudioWordmark inverse />
            <span className="hidden items-center gap-2 text-xs text-slate-400 sm:flex">
              <Check className="h-3 w-3" aria-hidden />
              Tu foto. Tu marca. Tu diseño.
            </span>
            <button
              type="button"
              onClick={show.toggle}
              aria-label={
                show.enabled
                  ? "Pausar recorrido automático"
                  : "Reproducir recorrido automático"
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-blue-400"
            >
              {show.enabled ? (
                <Pause className="h-4 w-4" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden />
              )}
              <span className="hidden sm:inline">
                {show.enabled ? "Pausar" : "Reproducir"}
              </span>
            </button>
          </div>
          <div className={styles.editorBody}>
            <aside
              className="hidden border-r border-white/10 p-4 min-[900px]:block"
              aria-label="Contenido del ejemplo"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                {example.sector}
              </p>
              <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-lg">
                <Image
                  src={example.image}
                  alt="Fotografía original del ejemplo"
                  fill
                  sizes="155px"
                  className="object-cover"
                />
              </div>
              <p className="mt-2 text-xs text-slate-300">{example.business}</p>
              <p className="mt-7 text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                Capas de tu anuncio
              </p>
              {[
                { Icon: Type, label: "Título" },
                { Icon: ImagePlus, label: "Fotografía" },
                { Icon: Layers3, label: "Precio" },
              ].map(({ Icon, label }) => (
                <div
                  key={label}
                  className={`mt-2 flex items-center gap-2 rounded-lg px-3 py-3 text-xs ${show.step === 1 ? "bg-accent/15 text-blue-300" : "text-slate-400"}`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </div>
              ))}
              <p className="mt-6 text-[11px] leading-5 text-slate-400">
                Cada elemento tiene su lugar. Tú decides cómo se ve.
              </p>
            </aside>
            <div className={styles.editorCanvas}>
              <div
                className="mb-3 flex flex-wrap justify-center gap-1"
                aria-label="Formato del ejemplo"
              >
                {FORMATS.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    aria-pressed={format === item.value}
                    onClick={() => {
                      studioViewTransition(() => {
                        setFormat(item.value);
                        show.goToStep(1);
                      });
                    }}
                    className={`min-h-11 rounded-lg px-3 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${format === item.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:bg-white/60"}`}
                  >
                    {item.label}
                    <span className="ml-1.5 hidden font-normal sm:inline">
                      {item.ratio}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex h-[380px] items-center justify-center sm:h-[380px]">
                <StudioWalkthroughScene
                  example={example}
                  step={show.step}
                  format={format}
                  priority={show.index === 0}
                  playing={show.running}
                  reducedMotion={show.reducedMotion || show.manual}
                />
              </div>
              <div
                className="mt-4 min-h-[78px] text-center"
                aria-live={show.enabled ? "off" : "polite"}
                aria-atomic="true"
              >
                <p className="text-sm font-bold text-slate-900">
                  {show.step + 1}. {step.title}
                </p>
                <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-slate-600">
                  {step.description}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    studioViewTransition(() =>
                      show.goToStep((show.step + 1) % 3),
                    )
                  }
                  className="mt-1 inline-flex min-h-11 items-center gap-2 rounded-lg px-3 text-xs font-semibold text-blue-700 focus-visible:outline-2 focus-visible:outline-blue-600 min-[900px]:hidden"
                >
                  Siguiente paso{" "}
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </button>
              </div>
              <p className="text-center text-[10px] text-slate-500">
                Recorrido ilustrativo · no publica ni consume Tlacos
              </p>
            </div>
            <aside
              className="hidden p-4 min-[900px]:block"
              aria-label="Explicación del paso"
            >
              <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-300">
                Paso {show.step + 1} de 3
              </p>
              <h3 className="mt-4 text-xl font-bold tracking-tight">
                {step.title}
              </h3>
              <p className="mt-4 text-xs leading-6 text-slate-300">
                {step.detail}
              </p>
              <div className="mt-6 border-t border-white/10 pt-5">
                <p className="text-sm font-semibold">
                  Una idea, muchas formas.
                </p>
                <p className="mt-2 text-xs leading-6 text-slate-400">
                  Reutiliza tu diseño y adáptalo a tus próximas publicaciones
                  sin gastar más Tlacos.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  show.step === 2
                    ? chooseExample((show.index + 1) % STUDIO_EXAMPLES.length)
                    : studioViewTransition(() => show.goToStep(show.step + 1))
                }
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-blue-300 focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                {show.step === 2 ? "Ver otro negocio" : "Siguiente paso"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </aside>
          </div>
        </div>
      </div>
      <div className="relative bg-accent px-4 py-5">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-2">
          {STUDIO_EXAMPLES.slice(0, 3).map((item, i) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={show.index === i}
              onClick={() => chooseExample(i)}
              className={`min-h-11 rounded-full border px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${show.index === i ? "border-white bg-white text-slate-900" : "border-white/40 text-white hover:bg-white/15"}`}
            >
              {item.sector}
            </button>
          ))}
          <div className="flex min-h-11 items-center gap-2 rounded-full border border-white/40 px-3">
            <label
              htmlFor={sectorId}
              className="text-xs font-semibold text-white"
            >
              Tu giro
            </label>
            <select
              id={sectorId}
              value={show.index}
              onChange={(event) => chooseExample(Number(event.target.value))}
              className="min-h-11 max-w-[160px] cursor-pointer rounded bg-transparent text-xs font-semibold text-white outline-offset-2 focus-visible:outline-2 focus-visible:outline-white"
            >
              {STUDIO_EXAMPLES.map((item, i) => (
                <option
                  key={item.id}
                  value={i}
                  className="bg-white text-slate-900"
                >
                  {item.sector}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
