"use client";

import Image from "next/image";
import Link from "next/link";
import { Check, Package, Repeat } from "lucide-react";

import { PlanSubscribeButton } from "@/features/sitio/components/plans/PlanSubscribeButton";

import { formatCurrency } from "@/features/qr/helpers/format";
import { storeDisplayFont, storeFocusRing } from "@/features/sitio/constants/storeClasses";
import { planEvery, planFacts, planSavings } from "@/features/planes/helpers/planDisplay";

import type { PlanCardProps } from "@/features/sitio/interfaces/storeComponents";

const VISIBLE_ITEMS = 4;

export function PlanCard({ plan, tenantId, slug }: PlanCardProps) {
  const href = `/sitio/${slug}/planes/${plan.slug}`;
  const savings = planSavings(plan);
  const every = planEvery(plan);
  const extra = plan.items.length - VISIBLE_ITEMS;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-(--store-radius) bg-(--store-surface) shadow-sm ring-1 ring-(--store-hairline)">
      <div className="relative overflow-hidden bg-accent px-5 pb-5 pt-4 text-accent-foreground">
        {plan.image_url ? (
          <Image src={plan.image_url} alt="" fill sizes="(max-width: 640px) 90vw, 400px" className="object-cover opacity-25" />
        ) : null}
        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-foreground/15 px-3 py-1 text-xs font-bold uppercase tracking-wider">
            <Repeat className="h-3.5 w-3.5" aria-hidden />
            Cada {every}
          </span>
          <h3 className={`mt-3 text-xl font-extrabold leading-tight ${storeDisplayFont}`}>
            <Link href={href} className={`rounded-sm after:absolute after:inset-0 after:content-[''] ${storeFocusRing}`}>
              {plan.name}
            </Link>
          </h3>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
            <span className="text-4xl font-bold tracking-tight">{formatCurrency(plan.price)}</span>
            <span className="text-sm font-semibold opacity-80">/ {every}</span>
          </p>
          {savings > 0 ? (
            <p className="mt-1 text-sm font-semibold opacity-90">
              Valor normal <span className="line-through">{formatCurrency(plan.list_value)}</span> · ahorras {formatCurrency(savings)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-(--store-ink-2)">Incluye cada {every}</p>
        <ul className="mt-3 space-y-2">
          {plan.items.slice(0, VISIBLE_ITEMS).map((item) => (
            <li key={item.product_id} className="flex items-center gap-3">
              <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-(--store-well)">
                {item.image_url ? (
                  <Image src={item.image_url} alt="" fill sizes="40px" className="object-cover" />
                ) : (
                  <span className="flex h-full items-center justify-center">
                    <Package className="h-4 w-4 text-(--store-ink-2)" aria-hidden />
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-(--store-ink)">{item.name}</span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-(--store-ink-2)">× {item.quantity}</span>
            </li>
          ))}
        </ul>
        {extra > 0 ? <p className="mt-2 text-sm font-medium text-(--store-ink-2)">y {extra} más</p> : null}

        <ul className="mt-4 space-y-1.5">
          {planFacts(plan).map((fact) => (
            <li key={fact} className="flex items-center gap-2 text-sm text-(--store-ink-2)">
              <Check className="h-4 w-4 shrink-0 text-accent" aria-hidden />
              {fact}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-5">
          <PlanSubscribeButton planId={plan.id} planName={plan.name} tenantId={tenantId} slug={slug} every={every} />
        </div>
      </div>
    </article>
  );
}
