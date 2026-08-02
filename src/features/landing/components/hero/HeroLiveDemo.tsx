"use client";

import { ArrowDown, Pause, Play, Smartphone, Store, Zap } from "lucide-react";

import { useHeroDemo } from "@/features/landing/hooks/useHeroDemo";
import { HeroPhone } from "@/features/landing/components/hero/HeroPhone";
import { HeroDashboard } from "@/features/landing/components/hero/HeroDashboard";

import { HERO_BEATS } from "@/features/landing/constants/heroDemo";

import type { HeroBeat } from "@/features/landing/constants/heroDemo";

/**
 * El centro del hero: el celular del cliente y el panel del negocio contando
 * UNA historia en sincronía, recorriendo los MÓDULOS de la plataforma (QR,
 * mesas, órdenes, suscripciones, préstamos, sitio web, mi dinero).
 *
 * Decisiones de UX, en orden de importancia:
 *
 *  1. MÓVIL PRIMERO. Ahí llega la mayoría y no cabe el panel completo: el
 *     dashboard de 300px de alto empujaba todo fuera de la pantalla. En móvil se
 *     muestra el celular + un "eco del panel" compacto (el dato clave y el
 *     aviso). Se conserva la historia de los dos lados a una fracción del alto.
 *     Desde `lg` sí caben los dos dispositivos completos, lado a lado.
 *  2. Recorre varios módulos, no solo mesas — hay que ver de entrada que es una
 *     plataforma completa, no una función suelta.
 *  3. Cada lado lleva su etiqueta de rol ("Tu cliente" / "Tu panel"): hay que
 *     saber qué se está mirando ANTES de mirarlo, no después.
 */

/** Etiqueta de rol sobre cada dispositivo. */
function DeviceLabel({
  icon: Icon,
  role,
  detail,
}: {
  icon: typeof Store;
  role: string;
  detail: string;
}) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/12 text-accent">
        <Icon className="h-3 w-3" aria-hidden />
      </span>
      <span className="shrink-0 text-[11px] font-bold text-foreground">
        {role}
      </span>
      <span className="truncate text-[11px] text-muted-foreground">
        · {detail}
      </span>
    </div>
  );
}

/**
 * Versión compacta del panel para móvil: el dato que más importa del módulo +
 * el aviso de lo que acaba de pasar. Cuesta ~90px en lugar de ~330px.
 */
function PanelEcho({ beat }: { beat: HeroBeat }) {
  return (
    <div className="w-full max-w-66">
      {/* Flecha que conecta el celular con el panel: sin ella son dos tarjetas
          sueltas y se pierde el "esto pasó por lo que hizo tu cliente". */}
      <div className="flex flex-col items-center py-1.5" aria-hidden>
        <span className="h-3 w-px bg-accent/30" />
        <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5">
          <Zap className="h-2.5 w-2.5 text-accent" />
          <span className="text-[9px] font-bold uppercase tracking-wide text-accent">
            Al instante
          </span>
        </span>
        <ArrowDown className="mt-0.5 h-3 w-3 text-accent" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
        <div className="flex items-center gap-1.5 border-b border-border bg-surface-raised px-2.5 py-2">
          <Store className="h-3 w-3 shrink-0 text-accent" aria-hidden />
          <span
            key={`${beat.key}-echo-title`}
            className="animate-fade-in-up truncate text-[10px] font-bold text-foreground"
          >
            Tu panel · {beat.panel.title}
          </span>
          <span className="ml-auto flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-1.5 py-0.5">
            <span
              className="animate-hero-live-pulse h-1 w-1 rounded-full bg-emerald-500"
              aria-hidden
            />
            <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
              En vivo
            </span>
          </span>
        </div>

        <div key={`${beat.key}-echo`} className="animate-fade-in-up space-y-2 p-2.5">
          {beat.panel.notice && (
            <div className="flex items-center gap-1.5 rounded-lg border border-accent/30 bg-accent/10 px-2 py-1.5">
              <span className="truncate text-[10px] font-bold text-accent">
                {beat.panel.notice}
              </span>
            </div>
          )}
          <div className="flex items-baseline justify-between gap-2">
            <span className="truncate text-[10px] font-medium text-muted-foreground">
              {beat.panel.metric.label}
            </span>
            <span className="shrink-0 text-base font-bold tabular-nums text-foreground">
              {beat.panel.metric.value}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileModuleExplorer({
  index,
  playing,
  goTo,
  toggle,
}: {
  index: number;
  playing: boolean;
  goTo: (index: number) => void;
  toggle: () => void;
}) {
  const beat = HERO_BEATS[index];

  return (
    <div className="mt-4 lg:hidden">
      <div className="rounded-xl border border-border bg-surface-raised p-2.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-foreground">Explora Tlaco</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Toca una capacidad para verla funcionar
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar demostración" : "Reproducir demostración"}
            className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden />
            )}
            {playing ? "Pausar" : "Reproducir"}
          </button>
        </div>

        <ol className="mt-3 grid grid-cols-4 gap-1.5">
          {HERO_BEATS.map((candidate, candidateIndex) => {
            const active = candidateIndex === index;
            const seen = candidateIndex < index;
            return (
              <li key={candidate.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => goTo(candidateIndex)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex min-h-13 w-full cursor-pointer flex-col gap-1.5 rounded-lg border px-1 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-transparent bg-surface hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`h-1 w-full rounded-full transition-colors ${
                      active
                        ? "bg-accent"
                        : seen
                          ? "bg-accent/35"
                          : "bg-border group-hover:bg-accent/40"
                    }`}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col items-center gap-1">
                    <candidate.icon
                      className={`h-3 w-3 shrink-0 transition-colors ${
                        active ? "text-accent" : "text-muted-foreground"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`text-center text-[9px] font-semibold leading-tight transition-colors ${
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {candidate.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-1.5 text-[11px] text-muted-foreground" aria-live="polite">
        {playing
          ? `Mostrando ${beat.label} · la demo avanzará sola`
          : `Mostrando ${beat.label} · elige otro módulo o reanuda la demo`}
      </p>
    </div>
  );
}

export function HeroLiveDemo() {
  const { index, playing, containerRef, goTo, toggle } = useHeroDemo();
  const beat = HERO_BEATS[index];

  return (
    <div ref={containerRef} className="w-full">
      {/* ── Caption: nombra el módulo y su beneficio ───────────── */}
      <div className="flex min-h-16 items-start gap-2.5 lg:min-h-19">
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/12 text-accent lg:h-8 lg:w-8">
          <beat.icon className="h-3.5 w-3.5 lg:h-4 lg:w-4" aria-hidden />
        </span>
        <div key={beat.key} className="animate-fade-in-up min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-accent lg:text-[11px]">
            {beat.label}
          </p>
          <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground lg:text-[15px]">
            {beat.caption}
          </p>
        </div>
      </div>

      {/* ── Dispositivos ───────────────────────────────────────── */}
      <MobileModuleExplorer
        index={index}
        playing={playing}
        goTo={goTo}
        toggle={toggle}
      />

      <div className="mt-3 flex flex-col items-center lg:mt-4 lg:flex-row lg:items-start lg:gap-0">
        <div className="shrink-0">
          <DeviceLabel
            icon={Smartphone}
            role="Tu cliente"
            detail={beat.phone.action}
          />
          <HeroPhone beat={beat} />
        </div>

        {/* Conector horizontal — solo cuando van lado a lado */}
        <div
          className="hidden shrink-0 flex-col items-center gap-1.5 self-center px-3 pt-8 lg:flex"
          aria-hidden
        >
          <span className="h-px w-8 bg-linear-to-r from-accent/20 to-accent" />
          <span className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5">
            <Zap className="h-2.5 w-2.5 text-accent" />
            <span className="text-[9px] font-bold uppercase tracking-wide text-accent">
              Sync
            </span>
          </span>
          <span className="h-px w-8 bg-linear-to-l from-accent/20 to-accent" />
        </div>

        {/* Móvil: eco compacto. Desktop: panel completo. */}
        <div className="flex w-full justify-center lg:hidden">
          <PanelEcho beat={beat} />
        </div>
        <div className="hidden w-full min-w-0 lg:block">
          <DeviceLabel icon={Store} role="Tu panel" detail={beat.panel.title} />
          <HeroDashboard beat={beat} />
        </div>
      </div>

      {/* ── Rail de módulos — tocable ──────────────────────────── */}
      <div className="mt-5 hidden rounded-xl border border-border bg-surface-raised p-2.5 lg:block">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-foreground">Explora Tlaco</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              Toca una capacidad para verla funcionar
            </p>
          </div>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pausar demostración" : "Reproducir demostración"}
            className="inline-flex min-h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background"
          >
            {playing ? (
              <Pause className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Play className="h-3.5 w-3.5" aria-hidden />
            )}
            {playing ? "Pausar" : "Reproducir"}
          </button>
        </div>

        {/* Todas las capacidades quedan visibles y son objetivos táctiles grandes. */}
        <ol className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-7">
          {HERO_BEATS.map((b, i) => {
            const active = i === index;
            const seen = i < index;
            return (
              <li key={b.key} className="min-w-0">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-current={active ? "step" : undefined}
                  className={`group flex min-h-13 w-full cursor-pointer flex-col gap-1.5 rounded-lg border px-1 py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-transparent bg-surface hover:border-accent/30"
                  }`}
                >
                  <span
                    className={`h-1 w-full rounded-full transition-colors ${
                      active
                        ? "bg-accent"
                        : seen
                          ? "bg-accent/35"
                          : "bg-border group-hover:bg-accent/40"
                    }`}
                    aria-hidden
                  />
                  <span className="flex min-w-0 flex-col items-center gap-1">
                    <b.icon
                      className={`h-3 w-3 shrink-0 transition-colors ${
                        active ? "text-accent" : "text-muted-foreground"
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`text-center text-[9px] font-semibold leading-tight transition-colors sm:text-[10px] ${
                        active
                          ? "text-foreground"
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                    >
                      {b.label}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <p className="mt-1.5 hidden text-[11px] text-muted-foreground lg:block" aria-live="polite">
        {playing
          ? "Recorriendo la plataforma — toca un módulo para explorarlo tú"
          : "En pausa — toca otro módulo o dale play para seguir"}
      </p>
    </div>
  );
}
