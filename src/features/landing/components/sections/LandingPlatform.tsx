"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Smartphone } from "lucide-react";

import {
  PLATFORM_CAPABILITIES,
  PLATFORM_GROUPS,
} from "@/features/landing/constants/platform";

import type { PlatformGroupKey } from "@/features/landing/constants/platform";

const CLOSING_PROMISES = [
  "Plan Gratis de $0 al mes",
  "Sin contratar terminal",
  "Solo pagas comisión cuando te pagan",
  "Funciona en celular, tablet y computadora",
];

/**
 * Un solo nivel de pestañas. Antes había además un switch dueño/cliente, y el
 * visitante veía 3 de 14 capacidades detrás de dos clics; ahora cada tarjeta
 * trae las dos miradas a la vez.
 */
export function LandingPlatform() {
  const [group, setGroup] = useState<PlatformGroupKey>("vender");

  const activeGroup =
    PLATFORM_GROUPS.find((g) => g.key === group) ?? PLATFORM_GROUPS[0];
  const visible = PLATFORM_CAPABILITIES.filter((c) => c.group === group);

  return (
    <section id="plataforma" className="scroll-mt-20 border-t border-border py-14 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <h2 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Una plataforma, <span className="text-accent">todo tu negocio.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
            Tu catálogo, tus pedidos, tu sitio web, tu crédito, tu equipo y tu
            dinero viven en la misma cuenta, y lo que haces de un lado tu cliente
            lo ve del otro.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Qué quieres resolver"
          className="mx-auto mt-8 grid max-w-md grid-cols-3 gap-1 rounded-2xl border border-border bg-surface-raised p-1"
        >
          {PLATFORM_GROUPS.map(({ key, label }) => {
            const active = key === group;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setGroup(key)}
                className={`min-h-11 cursor-pointer rounded-xl text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  active
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-surface hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div key={group} className="animate-fade-in-up">
          <div className="mt-6 text-center">
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {activeGroup.headline}
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              {activeGroup.description}
            </p>
          </div>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {visible.map(({ key, icon: Icon, title, owner, customer }) => (
              <li
                key={key}
                className="flex flex-col rounded-xl border border-border bg-surface p-4 sm:p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <Icon className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <h4 className="text-sm font-bold text-foreground">{title}</h4>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-foreground">{owner}</p>
                {customer && (
                  <p className="mt-3 flex gap-2 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
                    <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" aria-label="Tu cliente" />
                    {customer}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 rounded-2xl border border-border bg-surface-raised p-5 sm:p-8">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Empiezas sin mensualidad.
              </h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {CLOSING_PROMISES.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <Link
              href="/registro"
              className="group mt-6 inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:mt-0 lg:w-auto"
            >
              Crear mi cuenta gratis
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
