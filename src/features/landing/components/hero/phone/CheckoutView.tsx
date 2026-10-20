import { Check, ClipboardList, Clock, CreditCard, RotateCcw, ShieldCheck } from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { getMenuTotal } from "@/features/landing/helpers/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

/** Igual que en producción: no se paga hasta que el pedido está listo. */
export function CheckoutView({ sandbox, controls }: HeroPhoneViewProps) {
  const total = formatMXN(getMenuTotal(sandbox));

  switch (sandbox.order) {
    case "draft":
      return (
        <>
          <PhoneHero kicker="Tu cuenta" title="Mesa 4" />
          <PhoneStatus
            icon={ClipboardList}
            tone="muted"
            title="Aún no hay nada que pagar"
            detail="Haz tu pedido y aquí pagas cuando esté listo"
          />
          <PhoneFooter label="Ir a pedir" onClick={() => controls.goToBeat("mesas")} />
        </>
      );
    case "received":
    case "in_progress":
      return (
        <>
          <PhoneHero kicker="Tu cuenta" title="Mesa 4" />
          <PhoneStatus
            icon={Clock}
            tone="muted"
            title={total}
            detail="Podrás pagar en cuanto tu pedido esté listo"
          />
          <PhoneFooter label="Ver mi pedido" onClick={() => controls.goToBeat("ordenes")} />
        </>
      );
    case "ready":
      return (
        <>
          <PhoneHero kicker="Tu cuenta" title="Mesa 4" />
          <div className="animate-hero-row-in flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Total a pagar
              </p>
              <p className="mt-1 text-4xl font-bold tracking-tight text-foreground">{total}</p>
            </div>
            <p className="flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-[10px] font-semibold text-muted-foreground">
              <ShieldCheck className="h-3 w-3 text-accent" aria-hidden />
              Pago seguro con tarjeta o débito
            </p>
          </div>
          <PhoneFooter
            label={`Pagar ${total}`}
            icon={CreditCard}
            onClick={() => controls.act({ type: "pay" })}
          />
        </>
      );
    case "paid":
      return (
        <>
          <PhoneStatus icon={Check} title={total} detail="Pago confirmado · Mesa 4">
            <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-[10px] font-semibold text-foreground">
              Tu comprobante ya está listo
            </span>
          </PhoneStatus>
          <PhoneFooter label="Volver a empezar" icon={RotateCcw} onClick={controls.restart} />
        </>
      );
  }
}
