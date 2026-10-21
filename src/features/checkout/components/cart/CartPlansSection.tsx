"use client";

import Image from "next/image";
import { Repeat, Trash2 } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { formatShortDate, nextChargeDate, planEvery } from "@/features/planes/helpers/planDisplay";

import type { CartPlansSectionProps } from "@/features/checkout/interfaces/cartPlans";

export function CartPlansSection({ plans, accentColor, onRemove }: CartPlansSectionProps) {
  if (plans.length === 0) return null;
  const startsOn = (line: CartPlansSectionProps["plans"][number]) => formatShortDate(nextChargeDate(line.plan));

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
        <Repeat className="h-4 w-4" style={{ color: accentColor }} aria-hidden />
        Suscripciones
      </p>
      <ul className="space-y-3">
        {plans.map((line) => {
          const every = planEvery(line.plan);
          return (
            <li key={line.id} className="flex gap-3 rounded-xl border border-gray-100 p-3 sm:gap-4 sm:p-4">
              <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 sm:h-20 sm:w-20">
                {line.plan.image_url ? (
                  <Image src={line.plan.image_url} alt="" fill sizes="80px" className="object-cover" />
                ) : (
                  <Repeat className="h-7 w-7 text-gray-300" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{line.plan.name}</h3>
                  <button
                    type="button"
                    onClick={() => onRemove(line.id)}
                    className="-mr-1 -mt-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                    aria-label={`Quitar ${line.plan.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">Hoy: primer periodo</span>
                  <span className="text-base font-bold tabular-nums" style={{ color: accentColor }}>
                    {formatCurrency(line.price_snapshot)}
                  </span>
                </p>
                <p className="mt-1.5 text-sm text-gray-500">
                  {line.plan.items_count} {line.plan.items_count === 1 ? "pieza" : "piezas"} cada {every}. Después {formatCurrency(line.price_snapshot)} cada {every}, desde el {startsOn(line)}.
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
