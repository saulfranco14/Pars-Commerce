import Link from "next/link";
import { studioFlags } from "@/features/studio/services/studioFlags";
import { CreditCard, Landmark, ShieldCheck } from "lucide-react";

import { LandingSection } from "@/features/landing/components/shared/LandingSection";
import { SectionHeader } from "@/features/landing/components/shared/SectionHeader";
import { PricingPlans } from "@/features/landing/components/sections/PricingPlans";

import { listBillingPlans } from "@/features/billing/billingService";
import { PLAN_ORDER, type BillingPlan } from "@/features/billing/entitlements";
import { createAdminClient } from "@/lib/supabase/admin";

async function getPlans(): Promise<BillingPlan[]> {
  try {
    return await listBillingPlans(createAdminClient());
  } catch (error) {
    console.error("No pudimos leer billing_plans para la landing", error);
    return [];
  }
}

export async function LandingPricing() {
  const plans = (await getPlans()).sort(
    (a, b) => PLAN_ORDER.indexOf(a.code) - PLAN_ORDER.indexOf(b.code),
  );
  return (
    <LandingSection id="precios" tone="alt" width="max-w-7xl">
      <SectionHeader
        eyebrow="Precios"
        title="Empieza gratis."
        accent="Paga cuando Tlaco ya te ahorra trabajo."
        lead="La membresía aumenta capacidad y automatizaciones. Si cancelas, tu catálogo, historial y clientes se conservan; sólo vuelves a los límites de Gratis."
      />

      {plans.length > 0 ? (
        <PricingPlans plans={plans} />
      ) : (
        <p className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-surface p-4 text-center text-sm text-muted-foreground">
          Los planes están actualizándose. Puedes crear tu cuenta gratis y
          revisarlos después desde el panel.
        </p>
      )}

      {plans.length > 0 && (
        <details className="mt-5 rounded-2xl border border-border bg-background">
          <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
            Comparar todos los límites
          </summary>
          <div className="overflow-x-auto border-t border-border">
            <table className="min-w-[720px] w-full text-left text-sm">
              <thead>
                <tr className="bg-border-soft/45">
                  <th className="p-3">Capacidad</th>
                  {plans.map((plan) => (
                    <th key={plan.code} className="p-3">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-soft">
                {[
                  {
                    label: "Negocios",
                    value: (p: BillingPlan) => p.entitlements.business_limit,
                  },
                  {
                    label: "Mesas activas",
                    value: (p: BillingPlan) =>
                      p.entitlements.active_table_limit,
                  },
                  {
                    label: "Kioscos",
                    value: (p: BillingPlan) =>
                      p.entitlements.active_kiosk_limit,
                  },
                  {
                    label: "Reportes avanzados",
                    value: (p: BillingPlan) =>
                      p.entitlements.advanced_reporting ? "Sí" : "—",
                  },
                  {
                    label: "Exportaciones",
                    value: (p: BillingPlan) =>
                      p.entitlements.export_reports ? "Sí" : "—",
                  },
                ].map((row) => (
                  <tr key={row.label}>
                    <th className="p-3 font-semibold text-foreground">
                      {row.label}
                    </th>
                    {plans.map((plan) => (
                      <td
                        key={plan.code}
                        className="p-3 tabular-nums text-muted-foreground"
                      >
                        {row.value(plan)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}

      <div className="mt-8 rounded-2xl border border-border bg-[#0f1c33] p-5 text-white sm:p-7">
        <p className="text-xs font-bold uppercase tracking-wider text-[#7cb3ff]">
          Transparencia del dinero
        </p>
        <h3 className="mt-1 text-xl font-black sm:text-2xl">
          Dos pagos distintos
        </h3>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <Landmark className="h-5 w-5 text-emerald-400" />
            <h4 className="mt-3 font-bold">1. Venta del cliente</h4>
            <p className="mt-1 text-sm leading-6 text-white/65">
              Tu cliente paga su compra. Ese dinero sigue el flujo de cobro y
              liquidación configurado por tu negocio.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4">
            <CreditCard className="h-5 w-5 text-[#e8a33d]" />
            <h4 className="mt-3 font-bold">2. Membresía Tlaco</h4>
            <p className="mt-1 text-sm leading-6 text-white/65">
              El negocio paga una mensualidad por capacidad, reportes y
              automatización. Nunca se activa sólo por registrarte.
            </p>
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-white/55">
          Las comisiones del procesador de pagos y, cuando aplique, la comisión
          de liquidación de Tlaco se muestran por separado antes de cobrar. La
          liquidación configurada puede variar entre 2% y 3.5% según su
          frecuencia, además del costo del procesador.
        </p>
      </div>
      <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="h-4 w-4" />
        <span>
          No necesitas tarjeta para iniciar. Un plan de pago requiere
          confirmación posterior.
        </span>
      </div>
      {studioFlags().public && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          <Link href="/studio" className="font-semibold text-accent">
            Tlaco Studio
          </Link>{" "}
          es una membresía adicional por negocio para crear anuncios. Se
          contrata por separado y no cambia tu plan de operación.
        </p>
      )}
    </LandingSection>
  );
}
