import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Package, Repeat } from "lucide-react";

import { PlanSubscribeButton } from "@/features/sitio/components/plans/PlanSubscribeButton";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";
import { StorePurchaseSteps } from "@/features/sitio/components/home/StorePurchaseSteps";

import { formatCurrency } from "@/features/qr/helpers/format";
import { planEvery, planFacts, planSavings } from "@/features/planes/helpers/planDisplay";
import { PLAN_HOW_IT_WORKS } from "@/features/sitio/constants/plans";
import { storeDisplayFont } from "@/features/sitio/constants/storeClasses";
import { getActivePlan, getStoreTenant } from "@/features/sitio/services/storefrontService";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string; planSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, planSlug } = await params;
  const tenant = await getStoreTenant(slug);
  const plan = tenant ? await getActivePlan(tenant.id, planSlug) : null;
  return { title: plan?.name ?? "Suscripción" };
}

export default async function PlanDetailPage({ params }: PageProps) {
  const { slug, planSlug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();
  const plan = await getActivePlan(tenant.id, planSlug);
  if (!plan) notFound();

  const every = planEvery(plan);
  const savings = planSavings(plan);

  return (
    <div className="space-y-12 sm:space-y-16">
      <StorePageHeader title={plan.name} back={{ href: `/sitio/${slug}/planes`, label: "Suscripciones" }} />

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="relative overflow-hidden rounded-(--store-radius) bg-accent p-6 text-accent-foreground shadow-lg sm:p-8 lg:col-span-2">
          {plan.image_url ? (
            <Image src={plan.image_url} alt="" fill sizes="(max-width: 1024px) 100vw, 480px" className="object-cover opacity-20" priority />
          ) : null}
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Repeat className="h-3.5 w-3.5" aria-hidden />
              Suscripción · cada {every}
            </span>
            <p className="mt-5 flex flex-wrap items-baseline gap-x-2">
              <span className={`text-5xl font-bold tracking-tight sm:text-6xl ${storeDisplayFont}`}>{formatCurrency(plan.price)}</span>
              <span className="text-lg font-semibold opacity-80">/ {every}</span>
            </p>
            {savings > 0 ? (
              <p className="mt-2 text-[15px] font-semibold opacity-90">
                Por separado <span className="line-through">{formatCurrency(plan.list_value)}</span> · ahorras {formatCurrency(savings)} cada {every}
              </p>
            ) : null}
            {plan.description ? <p className="mt-4 whitespace-pre-line text-[15px] leading-relaxed opacity-90">{plan.description}</p> : null}
            <ul className="mt-5 space-y-2">
              {planFacts(plan).map((fact) => (
                <li key={fact} className="flex items-center gap-2 text-[15px] font-medium">
                  <Check className="h-4 w-4 shrink-0" aria-hidden />
                  {fact}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-2xl bg-(--store-surface) p-3">
              <PlanSubscribeButton planId={plan.id} planName={plan.name} tenantId={tenant.id} slug={slug} every={every} />
            </div>
          </div>
        </section>

        <section aria-labelledby="plan-items-title" className="lg:col-span-3">
          <h2 id="plan-items-title" className={`text-2xl font-extrabold tracking-tight text-(--store-ink) ${storeDisplayFont}`}>
            Incluye cada {every}
          </h2>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {plan.items.map((item) => (
              <li key={item.product_id} className="overflow-hidden rounded-(--store-radius) bg-(--store-surface) ring-1 ring-(--store-hairline)">
                <span className="relative block aspect-square bg-(--store-well)">
                  {item.image_url ? (
                    <Image src={item.image_url} alt="" fill sizes="(max-width: 640px) 45vw, 220px" className="object-cover" />
                  ) : (
                    <span className="flex h-full items-center justify-center">
                      <Package className="h-8 w-8 text-(--store-ink-2) opacity-50" aria-hidden />
                    </span>
                  )}
                  <span className="absolute right-2 top-2 rounded-full bg-accent px-2.5 py-0.5 text-sm font-bold tabular-nums text-accent-foreground shadow-sm">
                    × {item.quantity}
                  </span>
                </span>
                <span className="block p-3 text-sm font-semibold leading-snug text-(--store-ink)">{item.name}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <StorePurchaseSteps steps={PLAN_HOW_IT_WORKS} title="Cómo funciona" subtitle="Sin tarjetas guardadas ni cargos sorpresa." />
    </div>
  );
}
