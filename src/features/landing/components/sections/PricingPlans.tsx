"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";

import { PLAN_PRESENTATION, planCapabilities } from "@/features/landing/constants/pricing";
import { trackHomeEvent } from "@/features/landing/helpers/trackHomeEvent";

import type { BillingPlan } from "@/features/billing/entitlements";

const MXN = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});

/**
 * Four plans side by side from `lg`; below it a tab per plan shows one card
 * at a time, so phones don't scroll past four stacked cards.
 */
export function PricingPlans({ plans }: { plans: BillingPlan[] }) {
  const [selected, setSelected] = useState(plans[0]?.code);

  return (
    <div className="mt-10">
      <div
        role="tablist"
        aria-label="Planes"
        className="mx-auto grid max-w-md grid-cols-4 gap-1 rounded-2xl border border-border bg-background p-1 lg:hidden"
      >
        {plans.map((plan) => (
          <button
            key={plan.code}
            type="button"
            role="tab"
            aria-selected={plan.code === selected}
            onClick={() => setSelected(plan.code)}
            className={`min-h-11 cursor-pointer rounded-xl text-xs font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm ${
              plan.code === selected
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {plan.name}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-5 lg:mt-0 lg:grid-cols-4">
        {plans.map((plan) => {
          const copy = PLAN_PRESENTATION[plan.code];
          const free = plan.amount_mxn === 0;
          return (
            <article
              key={plan.code}
              className={`h-full flex-col rounded-2xl border bg-background p-6 lg:flex ${
                plan.code === selected ? "flex" : "hidden"
              } ${free ? "border-2 border-accent" : "border-border"}`}
            >
              <p className="text-xs font-bold uppercase tracking-widest text-accent">{copy.eyebrow}</p>
              <h3 className="mt-1 text-xl font-bold tracking-tight text-foreground">{plan.name}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground xl:min-h-12">
                {copy.promise}
              </p>
              <p className="mt-5 text-4xl font-bold tracking-tight tabular-nums text-foreground">
                {MXN.format(plan.amount_mxn)}
                <span className="text-sm font-medium tracking-normal text-muted-foreground">/mes</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {free ? "Sin costo fijo" : `Equivale a ${MXN.format(plan.amount_mxn / 30)} al día aprox.`}
              </p>
              <p className="my-5 rounded-xl bg-border-soft/50 p-3 text-xs font-semibold leading-5 text-foreground">
                {copy.fit}
              </p>
              <ul className="mb-6 space-y-2.5">
                {planCapabilities(plan).map((capability) => (
                  <li key={capability} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                    {capability}
                  </li>
                ))}
              </ul>
              <Link
                href={`/registro?plan=${plan.code}`}
                onClick={() => trackHomeEvent("home_cta_click", { location: `pricing_${plan.code}` })}
                className={`mt-auto flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 ${
                  free
                    ? "bg-accent text-white hover:bg-accent-hover"
                    : "border border-border text-foreground hover:bg-border-soft/50"
                }`}
              >
                {free ? "Empezar gratis" : `Elegir ${plan.name}`}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
