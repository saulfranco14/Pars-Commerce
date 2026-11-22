"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Smartphone } from "lucide-react";

import { HomeCta } from "@/features/landing/components/shared/HomeCta";
import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";

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
export function LandingPlatform({
  enabledProducts = [],
}: {
  enabledProducts?: string[];
}) {
  const [group, setGroup] = useState<PlatformGroupKey>("vender");

  const activeGroup =
    PLATFORM_GROUPS.find((g) => g.key === group) ?? PLATFORM_GROUPS[0];
  const visible = PLATFORM_CAPABILITIES.filter(
    (c) =>
      c.group === group &&
      (!c.availability || enabledProducts.includes(c.availability)),
  );

  return (
    <LandingSection id="plataforma" tone="alt">
      <SectionHeader
        eyebrow="Una sola cuenta"
        title="Una plataforma,"
        accent="todo tu negocio."
        lead="Tu catálogo, tus pedidos, tu sitio web, tu crédito, tu equipo y tu dinero viven en la misma cuenta, y lo que haces de un lado tu cliente lo ve del otro."
      />

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
          {visible.map(({ key, icon: Icon, title, owner, customer, href }) => (
            <li
              key={key}
              className="flex flex-col rounded-2xl border border-border bg-background p-6"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </span>
                <h4 className="text-sm font-bold text-foreground">
                  {href ? (
                    <Link
                      href={href}
                      className="text-accent underline-offset-4 hover:underline"
                    >
                      {title}
                    </Link>
                  ) : (
                    title
                  )}
                </h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-foreground">
                {owner}
              </p>
              {customer && (
                <p className="mt-3 flex gap-2 border-t border-border pt-3 text-[13px] leading-relaxed text-muted-foreground">
                  <Smartphone
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent"
                    aria-label="Tu cliente"
                  />
                  {customer}
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-10 rounded-2xl border border-border bg-background p-6 sm:p-8">
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              Empiezas sin mensualidad.
            </h3>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {CLOSING_PROMISES.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-muted-foreground"
                >
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-accent"
                    aria-hidden
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 shrink-0 lg:mt-0">
            <HomeCta location="plataforma" />
          </div>
        </div>
      </div>
    </LandingSection>
  );
}
