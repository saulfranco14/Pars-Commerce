"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight } from "lucide-react";

import { useHeroScene } from "@/features/landing/hooks/useHeroScene";
import { HeroStage } from "@/features/landing/components/hero/HeroStage";

import { HERO_GIRO_LINKS, HERO_SCENES, HERO_STEPS } from "@/features/landing/constants/heroScenes";
import { trackHomeEvent } from "@/features/landing/helpers/trackHomeEvent";

import type { HeroSceneSelection } from "@/features/landing/interfaces/heroScene";

/**
 * Mobile order is deliberate: headline and CTA, then the scene, then the
 * paragraph. On `lg` the paragraph moves back above the CTA.
 */
export function HeroExperience({
  initial,
  registerHref,
}: {
  initial: HeroSceneSelection;
  registerHref: string;
}) {
  const { containerRef, index, scene, replayKey, paused, reducedMotion, toggle } =
    useHeroScene(initial);

  useEffect(() => {
    trackHomeEvent("home_view", {
      giro: HERO_SCENES[initial.index].key,
      campaign: initial.fromCampaign ? "yes" : "no",
    });
  }, [initial]);

  return (
    <div className="flex flex-col items-center text-center">
      <p className="order-1 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 py-1.5 pl-1.5 pr-4 text-sm text-slate-300">
        <span className="relative h-7 w-7 overflow-hidden rounded-full">
          <Image key={scene.key} src={scene.image} alt="" fill sizes="28px" className="object-cover" />
        </span>
        <span>
          Hecho para tu <strong className="font-semibold text-white">{scene.word}</strong>
        </span>
      </p>

      <h1 className="order-2 mt-5 max-w-4xl text-balance text-[2.5rem] font-bold leading-[1.02] tracking-tighter text-white sm:text-6xl">
        Tu cliente pide y paga desde su celular.{" "}
        <span className="text-accent">Tú lo ves al instante.</span>
      </h1>

      <p className="order-5 mt-8 max-w-xl text-base leading-relaxed text-slate-300 lg:order-3 lg:mt-6 lg:text-lg">
        Mesas con QR, tienda en línea, cuotas y crédito en una sola cuenta. Eliges tu giro y
        empiezas con tu catálogo ya armado.
      </p>

      <div className="order-3 mt-7 flex w-full flex-col items-center gap-3 lg:order-4">
        <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:gap-4">
          <Link
            href={registerHref}
            onClick={() =>
              trackHomeEvent("home_cta_click", { location: "hero", giro: scene.key })
            }
            className="group inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-8 text-base font-semibold text-white ring-4 ring-accent/25 transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-white sm:w-auto"
          >
            Crear mi cuenta gratis
            <ArrowRight
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </Link>
          <Link
            href="#demo"
            onClick={() => trackHomeEvent("home_how_click", { giro: scene.key })}
            className="hidden min-h-14 items-center gap-1.5 px-3 text-base font-semibold text-slate-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white sm:inline-flex"
          >
            Ver cómo funciona
            <ArrowDown className="h-4 w-4" aria-hidden />
          </Link>
        </div>
        <p className="text-[13px] text-slate-400">
          $0 al mes para empezar · Sin tarjeta · Lista en 2 minutos
        </p>
      </div>

      <div className="order-4 mt-10 w-full lg:order-5">
        <HeroStage
          scene={scene}
          replayKey={replayKey}
          paused={paused}
          reducedMotion={reducedMotion}
          priority={index === initial.index}
          onToggle={toggle}
          containerRef={containerRef}
        />
      </div>

      <ol className="order-6 mt-6 grid w-full grid-cols-3 gap-2 lg:hidden">
        {HERO_STEPS.map((step, i) => (
          <li
            key={step.short}
            className="rounded-2xl border border-white/10 bg-white/5 px-1.5 py-3 text-xs font-semibold text-white"
          >
            <span className="block text-accent">{i + 1}</span>
            {step.short}
          </li>
        ))}
      </ol>

      <nav aria-label="Tlaco por giro" className="order-7 mt-12 flex flex-col items-center gap-4 lg:mt-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Un solo sistema para cualquier giro
        </p>
        <ul className="flex flex-wrap justify-center gap-2.5">
          {HERO_GIRO_LINKS.map((giro) => (
            <li key={giro.href}>
              <Link
                href={giro.href}
                className="inline-flex min-h-11 items-center gap-2.5 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-4 text-sm text-slate-200 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <span className="relative h-8 w-8 overflow-hidden rounded-full">
                  <Image src={giro.image} alt="" fill sizes="32px" className="object-cover" />
                </span>
                {giro.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
