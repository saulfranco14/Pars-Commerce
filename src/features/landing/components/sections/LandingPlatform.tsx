"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Store, Smile } from "lucide-react";

import {
  PLATFORM_CAPABILITIES,
  PLATFORM_GROUPS,
} from "@/features/landing/constants/platform";

import type { PlatformGroupKey } from "@/features/landing/constants/platform";

type Perspective = "owner" | "customer";

const PERSPECTIVES: {
  key: Perspective;
  label: string;
  hint: string;
  icon: typeof Store;
}[] = [
  {
    key: "owner",
    label: "Lo que ganas tú",
    hint: "Lo que ves y controlas desde tu panel.",
    icon: Store,
  },
  {
    key: "customer",
    label: "Lo que vive tu cliente",
    hint: "La experiencia que le das sin explicarle nada.",
    icon: Smile,
  },
];

export function LandingPlatform() {
  const [perspective, setPerspective] = useState<Perspective>("owner");
  const [group, setGroup] = useState<PlatformGroupKey>("vender");

  const activeGroup =
    PLATFORM_GROUPS.find((g) => g.key === group) ?? PLATFORM_GROUPS[0];

  const visible = PLATFORM_CAPABILITIES.filter(
    (c) => c.group === group && (perspective === "owner" || c.customer),
  );
  const internalCount = PLATFORM_CAPABILITIES.filter(
    (c) => c.group === group && !c.customer,
  ).length;

  return (
    <section id="plataforma" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center">
          <div
            className="mx-auto mb-4 h-1 w-10 rounded-full bg-accent"
            aria-hidden
          />
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Una plataforma,{" "}
            <span className="text-accent">todo tu negocio.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:text-lg">
            No es solo cobrar. Es tu catálogo, tus pedidos, tu sitio web, tu
            crédito, tu equipo y tu dinero — en un mismo lugar. Y cada cosa
            mejora tu día y la experiencia de tu cliente.
          </p>
        </div>

        {/* ── Switch de perspectiva: el diferenciador ─────────── */}
        <div className="mt-10 flex flex-col items-center">
          <div
            role="tablist"
            aria-label="Perspectiva"
            className="inline-flex rounded-2xl border border-border bg-surface p-1"
          >
            {PERSPECTIVES.map(({ key, label, icon: Icon }) => {
              const active = key === perspective;
              return (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setPerspective(key)}
                  className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:px-5 ${
                    active
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>
          <p
            key={perspective}
            className="animate-fade-in-up mt-3 text-sm text-muted-foreground"
          >
            {PERSPECTIVES.find((p) => p.key === perspective)?.hint}
          </p>
        </div>

        {/* ── Grupos: vender / cobrar / crecer ────────────────── */}
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {PLATFORM_GROUPS.map(({ key, label }) => {
            const active = key === group;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setGroup(key)}
                aria-pressed={active}
                className={`inline-flex min-h-11 cursor-pointer items-center rounded-full border px-5 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div key={group} className="animate-fade-in-up mt-8 text-center">
          <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {activeGroup.headline}
          </h3>
          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {activeGroup.description}
          </p>
        </div>

        {/* ── Capacidades ─────────────────────────────────────── */}
        <ul
          key={`${group}-${perspective}`}
          className="animate-fade-in-up mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {visible.map(({ key, icon: Icon, title, owner, customer }) => (
            <li
              key={key}
              className="flex flex-col rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent/30"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                  <Icon className="h-4.5 w-4.5" aria-hidden />
                </div>
                <h4 className="text-sm font-bold text-foreground">{title}</h4>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {perspective === "owner" ? owner : customer}
              </p>
            </li>
          ))}
        </ul>

        {perspective === "customer" && internalCount > 0 && (
          <p className="mt-5 text-center text-sm text-muted-foreground">
            + {internalCount}{" "}
            {internalCount === 1 ? "herramienta" : "herramientas"} que solo ves
            tú (tu dinero, tus números, tu administración).
          </p>
        )}

        {/* ── Cierre: la promesa completa ─────────────────────── */}
        <div className="mt-14 rounded-2xl border border-border bg-surface-raised p-6 sm:p-8">
          <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Todo esto, sin mensualidad.
              </h3>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  "Los 14 módulos incluidos desde el día uno",
                  "Sin contratar terminal",
                  "Solo pagas comisión cuando te pagan",
                  "Funciona en celular, tablet y computadora",
                ].map((item) => (
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
            <Link
              href="/registro"
              className="group mt-6 inline-flex min-h-11 w-full shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-8 py-3.5 text-base font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background lg:mt-0 lg:w-auto"
            >
              Empezar gratis
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
