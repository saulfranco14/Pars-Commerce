"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Gift, ShieldCheck, Sparkles } from "lucide-react";

import { LANDING_PLANS } from "@/features/landing/constants/pricing";

export function LandingPricing() {
  const [mode, setMode] = useState<"free" | "paid">("free");
  const visiblePlans = mode === "free"
    ? LANDING_PLANS.filter((plan) => plan.code === "free")
    : LANDING_PLANS.filter((plan) => plan.code !== "free");
  return (
    <section id="precios" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles className="h-4 w-4" /></div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Empieza gratis. Crece cuando tu operación lo pida.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">Todos los planes conservan catálogo, pedidos, pagos y equipo ilimitado. Solo pagas por la capacidad que ya estás usando.</p>
        </div>

        <div className="mx-auto mt-7 flex w-full max-w-sm rounded-xl border border-border bg-surface-raised p-1" role="group" aria-label="Tipo de plan">
          <button type="button" onClick={() => setMode("free")} aria-pressed={mode === "free"} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${mode === "free" ? "bg-surface text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><Gift className="h-4 w-4" /> Gratis</button>
          <button type="button" onClick={() => setMode("paid")} aria-pressed={mode === "paid"} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg px-3 text-sm font-bold transition-colors ${mode === "paid" ? "bg-accent text-accent-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}><CreditCard className="h-4 w-4" /> Planes de pago</button>
        </div>

        <div className={`mx-auto mt-7 grid gap-3 ${mode === "free" ? "max-w-sm" : "max-w-5xl md:grid-cols-3"}`}>
          {visiblePlans.map((plan) => (
            <article key={plan.code} className={`relative flex min-h-[410px] flex-col rounded-2xl border p-5 shadow-sm ${plan.featured ? "border-accent bg-accent/5" : "border-border bg-surface"}`}>
              {plan.featured && <span className="absolute -top-3 left-4 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-accent-foreground">Más elegido</span>}
              <p className="text-xs font-bold uppercase tracking-wide text-accent">{plan.eyebrow}</p>
              <h3 className="mt-1 text-xl font-bold text-foreground">{plan.name}</h3>
              <p className="mt-2 min-h-10 text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-5 text-3xl font-bold tabular-nums text-foreground">${plan.price.toLocaleString("es-MX")}<span className="text-sm font-medium text-muted-foreground">/mes</span></p>
              <ul className="mt-5 space-y-2.5">{plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{feature}</li>)}</ul>
              <Link href="/registro" className={`mt-auto flex min-h-12 w-full items-center justify-center rounded-xl px-4 text-sm font-bold transition-colors ${plan.featured ? "bg-accent text-accent-foreground hover:bg-accent-hover" : "border border-border bg-surface text-foreground hover:bg-border-soft/40"}`}>{plan.price === 0 ? "Crear cuenta gratis" : `Elegir ${plan.name}`}</Link>
            </article>
          ))}
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /><span>Cambia o cancela desde tu panel, sin soporte obligatorio.</span></div>
      </div>
    </section>
  );
}
