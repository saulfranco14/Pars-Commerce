import Link from "next/link";
import { notFound } from "next/navigation";
import { LockKeyhole, MessageCircle, Package, Repeat, Store, Truck } from "lucide-react";

import { createAdminClient } from "@/lib/supabase/admin";
import { Notification } from "@/components/ui/Notification";
import { PlanRenewalControl } from "@/features/suscripciones/components/PlanRenewalControl";

import { formatCurrency } from "@/features/qr/helpers/format";
import { planEvery, weekdayPlural } from "@/features/planes/helpers/planDisplay";
import { whatsappHref } from "@/features/sitio/helpers/storeLinks";
import {
  formatPlanDate,
  PLAN_PERIOD_LABELS,
  PLAN_SUBSCRIPTION_STATUS_META,
} from "@/features/suscripciones/helpers/planSubscriptionView";
import { getPublicPlan } from "@/features/suscripciones/services/planSubscriptionService";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PublicPlanPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const plan = await getPublicPlan(createAdminClient(), token);
  if (!plan) notFound();

  const status = PLAN_SUBSCRIPTION_STATUS_META[plan.status];
  const due = plan.due_period;
  const running = plan.status === "active" || plan.status === "past_due";
  const firstPending = plan.status === "pending_setup" ? plan.periods.find((period) => period.period_number === 1) : null;
  const periodEnd = formatPlanDate(plan.current_period_end);
  const DeliveryIcon = plan.fulfillment_method === "delivery" ? Truck : Store;

  return (
    <main className="min-h-screen bg-background px-4 pb-16 pt-5 sm:px-6 sm:pt-10">
      <section className="mx-auto max-w-2xl space-y-5">
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Suscripción en {plan.tenant.name}</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">Hola, {plan.customer_name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-muted-foreground">Guarda este enlace: aquí pagas cada periodo y administras tu suscripción.</p>
          </div>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border-soft bg-surface text-muted-foreground" aria-label="Enlace privado">
            <LockKeyhole className="h-4 w-4" aria-hidden />
          </span>
        </header>

        <div className="rounded-3xl border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Repeat className="h-4 w-4 text-accent" aria-hidden />
              {plan.plan.name}
            </span>
            <span className="rounded-full bg-border-soft px-3 py-1 text-xs font-semibold text-foreground">{status.label}</span>
          </div>
          <p className="mt-3 text-5xl font-bold tracking-tight text-foreground">{formatCurrency(plan.plan.price)}</p>
          <p className="mt-1 text-sm text-muted-foreground">cada {planEvery(plan.plan)}</p>
          {running && plan.current_period_end ? (
            <p className="mt-4 text-sm text-foreground">
              {plan.cancel_at_period_end ? (
                <>Tu suscripción termina el <strong>{periodEnd}</strong>.</>
              ) : (
                <>Tu periodo actual termina el <strong>{periodEnd}</strong>.</>
              )}
            </p>
          ) : null}
        </div>

        {firstPending ? (
          <Notification
            tone="warning"
            title="Falta tu primer pago"
            message="Tu suscripción empieza cuando el negocio confirme el pago de tu pedido."
          />
        ) : null}

        {due && running ? (
          <div className="space-y-3 rounded-3xl border border-amber-500/30 bg-amber-500/5 p-5">
            <Notification
              tone={due.status === "overdue" ? "error" : "warning"}
              title={due.status === "overdue" ? `Tu periodo ${due.period_number} está vencido` : `Tu periodo ${due.period_number} ya está listo`}
              message={`Total ${formatCurrency(due.amount)} · vence el ${formatPlanDate(due.due_at)}.`}
            />
            {due.order_tracking_token ? (
              <Link
                href={`/pedido/${due.order_tracking_token}`}
                className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-accent px-4 text-base font-semibold text-accent-foreground hover:bg-accent-hover"
              >
                Pagar {formatCurrency(due.amount)}
              </Link>
            ) : null}
          </div>
        ) : null}

        <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="text-sm font-semibold text-foreground">Incluye cada periodo</h2>
          <ul className="mt-3 space-y-2">
            {plan.plan.items.map((item) => (
              <li key={`${item.product_id}:${item.product_variant_id ?? ""}`} className="flex items-center gap-3 text-sm">
                <Package className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-foreground">{item.name}</span>
                <span className="font-semibold tabular-nums text-muted-foreground">× {item.quantity}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <DeliveryIcon className="h-4 w-4 shrink-0" aria-hidden />
            {plan.fulfillment_method === "delivery" ? "Entrega a domicilio" : "Recoges en el negocio"}
            {plan.plan.preferred_weekday !== null ? `, ${weekdayPlural(plan.plan.preferred_weekday)}` : ""}
          </p>
        </div>

        {plan.periods.length > 0 ? (
          <div className="rounded-3xl border border-border bg-surface p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground">Tus periodos</h2>
            <ul className="mt-3 divide-y divide-border">
              {[...plan.periods].reverse().map((period) => (
                <li key={period.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="text-foreground">
                    Periodo {period.period_number}
                    <span className="ml-2 text-muted-foreground">
                      {formatPlanDate(period.starts_at)} – {formatPlanDate(period.ends_at)}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-semibold tabular-nums text-foreground">{formatCurrency(period.amount)}</span>
                    <span className="block text-xs text-muted-foreground">{PLAN_PERIOD_LABELS[period.status]}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {running ? <PlanRenewalControl token={token} cancelAtPeriodEnd={plan.cancel_at_period_end} periodEndLabel={plan.current_period_end ? periodEnd : null} /> : null}

        {plan.tenant.whatsapp_phone ? (
          <a
            href={whatsappHref(plan.tenant.whatsapp_phone, `Hola, tengo una duda sobre mi suscripción ${plan.plan.name}.`)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold text-accent hover:bg-accent/10"
          >
            <MessageCircle className="h-4 w-4" aria-hidden />
            Escribir a {plan.tenant.name}
          </a>
        ) : null}
      </section>
    </main>
  );
}
