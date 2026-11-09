"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import { STUDIO_EXAMPLES } from "../../constants/marketing";
import { useStudioShowcase } from "../../hooks/useStudioShowcase";
import { StudioExamplePoster } from "./StudioExamplePoster";
import { studioViewTransition } from "../../helpers/marketingTransition";
import styles from "./studioMarketing.module.css";

export function StudioExamplesGallery() {
  const show = useStudioShowcase(STUDIO_EXAMPLES.length, 1, 6500);
  const [original, setOriginal] = useState<string | null>(null);
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = rail.current;
    const card = element?.children[show.index] as HTMLElement | undefined;
    if (element && card)
      element.scrollTo({
        left: card.offsetLeft,
        behavior: show.reducedMotion ? "instant" : "smooth",
      });
  }, [show.index, show.reducedMotion]);
  function move(delta: number) {
    setOriginal(null);
    const element = rail.current;
    let nearest = show.index;
    if (element) {
      if (
        delta > 0 &&
        element.scrollLeft + element.clientWidth >= element.scrollWidth - 8
      ) {
        show.choose(0);
        return;
      }
      if (delta < 0 && element.scrollLeft <= 8) {
        show.choose(STUDIO_EXAMPLES.length - 1);
        return;
      }
      let distance = Infinity;
      Array.from(element.children).forEach((child, i) => {
        const gap = Math.abs(
          (child as HTMLElement).offsetLeft - element.scrollLeft,
        );
        if (gap < distance) {
          distance = gap;
          nearest = i;
        }
      });
    }
    show.choose(nearest + delta);
  }
  return (
    <div ref={show.container} {...show.interaction} className="mt-8">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden />
          Toca un anuncio para ver la foto con la que empezó.
        </p>
        <div
          className="flex items-center gap-1"
          aria-label="Controles de ejemplos"
        >
          <button
            type="button"
            onClick={() => move(-1)}
            aria-label="Ver negocios anteriores"
            className={styles.galleryControl}
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => {
              setOriginal(null);
              show.toggle();
            }}
            aria-label={
              show.enabled
                ? "Pausar ejemplos automáticos"
                : "Reproducir ejemplos automáticos"
            }
            className={styles.galleryControl}
          >
            {show.enabled ? (
              <Pause className="h-4 w-4" aria-hidden />
            ) : (
              <Play className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            aria-label="Ver más negocios"
            className={styles.galleryControl}
          >
            <ArrowRight className="h-4 w-4" aria-hidden />
          </button>
          <span className="ml-2 text-xs text-muted-foreground">
            {STUDIO_EXAMPLES.length} giros para inspirarte
          </span>
        </div>
      </div>
      <div
        ref={rail}
        className={`${styles.exampleRail} mt-5`}
        role="region"
        aria-label="Ejemplos de anuncios por giro"
        aria-roledescription="carrusel"
        onPointerDown={show.pause}
        onWheel={show.pause}
      >
        {STUDIO_EXAMPLES.map((example, i) => (
          <figure key={example.id} className={styles.exampleSlide}>
            <button
              type="button"
              onClick={() => {
                show.pause();
                studioViewTransition(() =>
                  setOriginal((current) =>
                    current === example.id ? null : example.id,
                  ),
                );
              }}
              style={{ viewTransitionName: `studio-example-${example.id}` }}
              aria-pressed={original === example.id}
              aria-label={`${original === example.id ? "Ver anuncio" : "Ver foto original"} de ${example.sector}`}
              className="group relative block w-full cursor-pointer overflow-hidden rounded-xl text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
            >
              <div className={styles.showcasePoster}>
                <StudioExamplePoster
                  example={example}
                  layout={
                    i % 3 === 1
                      ? "editorial"
                      : i % 3 === 2
                        ? "framed"
                        : "classic"
                  }
                />
              </div>
              {original === example.id && (
                <div
                  className={`${styles.sceneEnter} absolute inset-0 overflow-hidden rounded-xl bg-slate-900`}
                >
                  <Image
                    src={example.image}
                    alt={`Fotografía original de ${example.sector}`}
                    fill
                    sizes="(max-width: 640px) 80vw, (max-width: 1024px) 30vw, 240px"
                    className="object-cover"
                  />
                  <span className="absolute inset-x-0 bottom-0 bg-slate-950/85 px-4 py-4 text-xs font-semibold text-white">
                    Foto original · {example.sector}
                  </span>
                </div>
              )}
              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/70 text-white transition-transform group-hover:rotate-12 motion-reduce:transition-none">
                <ImagePlus className="h-3.5 w-3.5" aria-hidden />
              </span>
            </button>
            <figcaption className="mt-4 flex items-start justify-between gap-2">
              <span>
                <span className="block text-sm font-semibold">
                  {example.sector}
                </span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {example.category}
                </span>
              </span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-7 text-center text-xs leading-6 text-muted-foreground">
        Ejemplos ilustrativos con marcas y precios de demostración.
      </p>
    </div>
  );
}
