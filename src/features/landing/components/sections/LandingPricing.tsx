import Link from "next/link";
import { Check, CreditCard, Landmark, ShieldCheck, Sparkles } from "lucide-react";

import { listBillingPlans } from "@/features/billing/billingService";
import { PLAN_ORDER, type BillingPlan } from "@/features/billing/entitlements";
import { PLAN_PRESENTATION, planCapabilities } from "@/features/landing/constants/pricing";
import { createAdminClient } from "@/lib/supabase/admin";

const MXN_FORMATTER = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
function money(value: number) { return MXN_FORMATTER.format(value); }

async function getPlans(): Promise<BillingPlan[]> {
  try {
    return await listBillingPlans(createAdminClient());
  } catch (error) {
    console.error("No pudimos leer billing_plans para la landing", error);
    return [];
  }
}

export async function LandingPricing() {
  const plans = (await getPlans()).sort((a, b) => PLAN_ORDER.indexOf(a.code) - PLAN_ORDER.indexOf(b.code));
  return (
    <section id="precios" className="border-t border-border py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><Sparkles className="h-4 w-4" /></div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-4xl">Empieza gratis. Paga cuando Tlaco ya te ahorra trabajo.</h2>
          <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">La membresía aumenta capacidad y automatizaciones. Si cancelas, tu catálogo, historial y clientes se conservan; sólo vuelves a los límites de Gratis.</p>
        </div>

        {plans.length > 0 ? (
          <div className="mt-9 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => {
              const copy = PLAN_PRESENTATION[plan.code];
              const daily = plan.amount_mxn / 30;
              return (
                <article key={plan.code} className="flex min-h-[430px] flex-col rounded-2xl border border-border bg-surface p-5 shadow-sm">
                  <p className="text-xs font-bold uppercase tracking-wider text-accent">{copy.eyebrow}</p>
                  <h3 className="mt-1 text-xl font-black text-foreground">{plan.name}</h3>
                  <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{copy.promise}</p>
                  <p className="mt-4 text-3xl font-black tabular-nums text-foreground">{money(plan.amount_mxn)}<span className="text-sm font-medium text-muted-foreground">/mes</span></p>
                  <p className="mt-1 text-xs text-muted-foreground">{plan.amount_mxn === 0 ? "Sin costo fijo" : `Equivale a ${money(daily)} al día aprox.`}</p>
                  <div className="my-4 rounded-xl bg-border-soft/50 p-3 text-xs font-semibold leading-5 text-foreground">{copy.fit}</div>
                  <ul className="space-y-2.5">
                    {planCapabilities(plan).map((capability) => <li key={capability} className="flex gap-2 text-sm text-foreground"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{capability}</li>)}
                  </ul>
                  <Link href={`/registro?plan=${plan.code}`} className="mt-auto flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2">
                    {plan.code === "free" ? "Crear cuenta gratis" : `Considerar ${plan.name}`}
                  </Link>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mx-auto mt-8 max-w-xl rounded-xl border border-border bg-surface p-4 text-center text-sm text-muted-foreground">Los planes están actualizándose. Puedes crear tu cuenta gratis y revisarlos después desde el panel.</p>
        )}

        {plans.length > 0 && (
          <details className="mt-5 rounded-2xl border border-border bg-surface">
            <summary className="cursor-pointer px-5 py-4 text-sm font-bold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">Comparar todos los límites</summary>
            <div className="overflow-x-auto border-t border-border">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead><tr className="bg-border-soft/45"><th className="p-3">Capacidad</th>{plans.map((plan) => <th key={plan.code} className="p-3">{plan.name}</th>)}</tr></thead>
                <tbody className="divide-y divide-border-soft">
                  {[{ label: "Negocios", value: (p: BillingPlan) => p.entitlements.business_limit }, { label: "Mesas activas", value: (p: BillingPlan) => p.entitlements.active_table_limit }, { label: "Kioscos", value: (p: BillingPlan) => p.entitlements.active_kiosk_limit }, { label: "Reportes avanzados", value: (p: BillingPlan) => p.entitlements.advanced_reporting ? "Sí" : "—" }, { label: "Exportaciones", value: (p: BillingPlan) => p.entitlements.export_reports ? "Sí" : "—" }].map((row) => <tr key={row.label}><th className="p-3 font-semibold text-foreground">{row.label}</th>{plans.map((plan) => <td key={plan.code} className="p-3 tabular-nums text-muted-foreground">{row.value(plan)}</td>)}</tr>)}
                </tbody>
              </table>
            </div>
          </details>
        )}

        <div className="mt-8 rounded-2xl border border-border bg-[#0f1c33] p-5 text-white sm:p-7">
          <p className="text-xs font-bold uppercase tracking-wider text-[#7cb3ff]">Transparencia del dinero</p>
          <h3 className="mt-1 text-xl font-black sm:text-2xl">Dos pagos distintos</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><Landmark className="h-5 w-5 text-emerald-400" /><h4 className="mt-3 font-bold">1. Venta del cliente</h4><p className="mt-1 text-sm leading-6 text-white/65">Tu cliente paga su compra. Ese dinero sigue el flujo de cobro y liquidación configurado por tu negocio.</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4"><CreditCard className="h-5 w-5 text-[#e8a33d]" /><h4 className="mt-3 font-bold">2. Membresía Tlaco</h4><p className="mt-1 text-sm leading-6 text-white/65">El negocio paga una mensualidad por capacidad, reportes y automatización. Nunca se activa sólo por registrarte.</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-white/55">Las comisiones del procesador de pagos y, cuando aplique, la comisión de liquidación de Tlaco se muestran por separado antes de cobrar. La liquidación configurada puede variar entre 2% y 3.5% según su frecuencia, además del costo del procesador.</p>
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="h-4 w-4" /><span>No necesitas tarjeta para iniciar. Un plan de pago requiere confirmación posterior.</span></div>
      </div>
    </section>
  );
}
