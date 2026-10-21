"use client";

import Link from "next/link";
import { Check, Loader2, Repeat, RotateCcw } from "lucide-react";

import { useCartAdd } from "@/features/sitio/hooks/useCartAdd";

import { addPlan } from "@/services/publicCartService";
import { storeFocusRing, storeTextLink } from "@/features/sitio/constants/storeClasses";

import type { PlanSubscribeButtonProps } from "@/features/sitio/interfaces/storeComponents";

const ICONS = { idle: Repeat, adding: Loader2, added: Check, error: RotateCcw } as const;
const LABELS = { idle: "Suscribirme", adding: "Agregando…", added: "En tu carrito", error: "Reintentar" } as const;

export function PlanSubscribeButton({ planId, planName, tenantId, slug, every }: PlanSubscribeButtonProps) {
  const { status, trigger, ready, errorMessage } = useCartAdd({
    add: (fingerprint) => addPlan(tenantId, planId, fingerprint),
    successLabel: `${planName} se agregó al carrito`,
  });
  const Icon = ICONS[status];

  return (
    <div className="relative z-10">
      <button
        type="button"
        onClick={trigger}
        disabled={!ready || status === "adding"}
        className={`inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-accent px-5 text-[15px] font-semibold text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60 motion-safe:active:scale-[0.98] ${storeFocusRing}`}
      >
        <Icon className={`h-4 w-4 ${status === "adding" ? "animate-spin" : ""}`} aria-hidden />
        {LABELS[status]}
      </button>
      {status === "error" && errorMessage ? (
        <p role="alert" className="mt-2 text-center text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      ) : status === "added" ? (
        <p className="mt-1 flex justify-center">
          <Link href={`/sitio/${slug}/carrito`} className={storeTextLink}>
            Ir a pagar
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-center text-xs text-(--store-ink-2)">Hoy pagas el primer periodo; después se cobra cada {every}.</p>
      )}
    </div>
  );
}
