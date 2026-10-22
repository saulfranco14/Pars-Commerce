"use client";

import Link from "next/link";
import { ArrowRight, Banknote } from "lucide-react";

import type { PaymentsSettingsLinkProps } from "@/features/sitio-web/interfaces/paymentsSettingsLink";

/** Charging and delivery serve the whole business, so they live in Configuración; the site points there. */
export function PaymentsSettingsLink({ tenantSlug }: PaymentsSettingsLinkProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-accent/20 bg-accent/4 p-5">
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Banknote className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-foreground">Cobros y entregas ahora están en Configuración</h2>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            Mercado Pago, transferencia, efectivo, entrega a domicilio y puntos de recolección aplican a todo tu negocio, no solo a tu sitio. Tu tienda en línea usa lo mismo que configures ahí.
          </p>
          <Link
            href={`/dashboard/${tenantSlug}/configuracion?tab=cobros`}
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            Ir a Cobros y entregas
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
