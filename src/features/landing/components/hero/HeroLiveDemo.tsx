"use client";

import { Pointer, Smartphone, Store, Zap } from "lucide-react";

import { useHeroDemo } from "@/features/landing/hooks/useHeroDemo";
import { HeroDashboard } from "@/features/landing/components/hero/HeroDashboard";
import { HeroGuideCard } from "@/features/landing/components/hero/HeroGuideCard";
import { HeroModuleTabs } from "@/features/landing/components/hero/HeroModuleTabs";
import { HeroPanelEcho } from "@/features/landing/components/hero/HeroPanelEcho";
import { HeroPhone } from "@/features/landing/components/hero/HeroPhone";

import { HERO_BEATS } from "@/features/landing/constants/heroDemo";

/**
 * Cuatro piezas y nada más: qué módulo, qué tocar, el celular del cliente y el
 * panel del negocio reaccionando. Cada capa extra competía con el celular, que
 * es lo único que el visitante tiene que mirar.
 */

function DeviceLabel({
  icon: Icon,
  role,
  hint = false,
}: {
  icon: typeof Store;
  role: string;
  /** Hasta que el visitante toca el celular, la etiqueta invita a tocarlo. */
  hint?: boolean;
}) {
  return (
    <div className="mb-2 flex min-h-6 items-center gap-1.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
      <span className="text-xs font-semibold text-muted-foreground">{role}</span>
      {hint && (
        <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background motion-safe:animate-pulse">
          <Pointer className="h-3 w-3" aria-hidden />
          Tócalo
        </span>
      )}
    </div>
  );
}

export function HeroLiveDemo() {
  const {
    index,
    beat,
    playing,
    touched,
    sandbox,
    panel,
    guide,
    beatDone,
    tapKey,
    controls,
    containerRef,
    goTo,
    toggle,
  } = useHeroDemo();
  const nextIndex = (index + 1) % HERO_BEATS.length;

  return (
    <div ref={containerRef} className="w-full">
      <HeroModuleTabs
        index={index}
        playing={playing}
        explored={sandbox.explored}
        goTo={goTo}
        toggle={toggle}
      />

      <div className="mt-3">
        <HeroGuideCard
          beatKey={beat.key}
          guide={guide}
          done={beatDone}
          nextLabel={HERO_BEATS[nextIndex].label}
          onNext={() => goTo(nextIndex)}
        />
      </div>

      <div className="mt-5 flex flex-col items-center lg:flex-row lg:items-start">
        <div className="shrink-0">
          <DeviceLabel icon={Smartphone} role="Tu cliente" hint={!touched} />
          <HeroPhone beat={beat} sandbox={sandbox} controls={controls} tapKey={tapKey} />
        </div>

        <div className="hidden shrink-0 items-center self-start px-1.5 pt-44 lg:flex" aria-hidden>
          <span className="h-px w-3 bg-accent/40" />
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-accent/30 bg-accent/10">
            <Zap className="h-3 w-3 text-accent" />
          </span>
          <span className="h-px w-3 bg-accent/40" />
        </div>

        <div className="flex w-full justify-center lg:hidden">
          <HeroPanelEcho beat={beat} panel={panel} />
        </div>
        <div className="hidden w-full min-w-0 lg:block">
          <DeviceLabel icon={Store} role="Tu panel, al instante" />
          <HeroDashboard beat={beat} panel={panel} />
        </div>
      </div>
    </div>
  );
}
