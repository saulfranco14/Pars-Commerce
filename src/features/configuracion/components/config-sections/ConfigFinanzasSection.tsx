"use client";

import Link from "next/link";
import { ArrowRight, Landmark } from "lucide-react";

import type { ConfigFinanzasSectionProps } from "@/features/configuracion/interfaces/sections";
import {
  inputClass,
  labelClass,
} from "@/features/configuracion/constants/formClasses";
import { MercadoPagoConnectionCard } from "@/features/payment-providers/components/MercadoPagoConnectionCard";

export function ConfigFinanzasSection({
  tenantId,
  tenantSlug,
  canManagePayments,
  monthlyRent,
  onMonthlyRentChange,
  monthlySalesObjective,
  onMonthlySalesObjectiveChange,
}: ConfigFinanzasSectionProps) {
  return (
    <div className="space-y-5">
      <MercadoPagoConnectionCard tenantId={tenantId} canManage={canManagePayments} />
      <section className="rounded-2xl border border-accent/20 bg-accent/[0.035] p-4">
        <div className="flex gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><Landmark className="h-5 w-5" aria-hidden /></span>
          <div className="min-w-0 flex-1"><h3 className="font-bold text-foreground">Cobros y entregas de tu sitio</h3><p className="mt-1 text-sm leading-5 text-muted-foreground">Activa transferencia, efectivo al recoger, domicilio y puntos de recolección. Esto es lo que verá el cliente al terminar su pedido.</p><Link href={`/dashboard/${tenantSlug}/sitio-web?tab=cobros`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-foreground px-3.5 text-sm font-bold text-background transition-opacity hover:opacity-90">Configurar cobros y entregas <ArrowRight className="h-4 w-4" aria-hidden /></Link></div>
        </div>
      </section>
      <div className="border-t border-border-soft pt-5">
      <p className="text-sm text-muted-foreground">
        Renta y objetivo de ventas para el dashboard.
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="config-monthly-rent" className={labelClass}>
            Renta mensual
          </label>
          <input
            id="config-monthly-rent"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={monthlyRent}
            onChange={(e) => onMonthlyRentChange(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
        <div>
          <label htmlFor="config-sales-objective" className={labelClass}>
            Objetivo de ventas mensual
          </label>
          <input
            id="config-sales-objective"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={monthlySalesObjective}
            onChange={(e) => onMonthlySalesObjectiveChange(e.target.value)}
            className={inputClass}
            placeholder="0.00"
          />
        </div>
      </div>
      </div>
    </div>
  );
}
