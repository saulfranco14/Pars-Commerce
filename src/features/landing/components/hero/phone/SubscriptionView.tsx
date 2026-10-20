import { Check, CreditCard, Repeat } from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneLink,
  PhoneStatus,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { HERO_PLANS } from "@/features/landing/constants/heroSandbox";
import { formatPlanCharge, getPlan } from "@/features/landing/helpers/heroSandbox";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

export function SubscriptionView({ sandbox, controls }: HeroPhoneViewProps) {
  const plan = getPlan(sandbox.plan);
  const charge = formatPlanCharge(plan);

  if (sandbox.subscribed) {
    return (
      <>
        <PhoneHero kicker="Cómo quieres pagar" title="Todo listo" />
        <PhoneStatus
          icon={Repeat}
          title="Suscripción activa"
          detail={
            plan.installments
              ? `${plan.label} de ${charge} · los siguientes se cobran solos`
              : `${charge} · se renueva sola cada mes`
          }
        >
          <PhoneLink
            onClick={() => controls.act({ type: "apply", patch: { subscribed: false } })}
          >
            Cambiar plan
          </PhoneLink>
        </PhoneStatus>
        <PhoneFooter label={`Siguiente: ${controls.nextLabel}`} onClick={controls.next} />
      </>
    );
  }

  return (
    <>
      <PhoneHero kicker="Cómo quieres pagar" title="Elige tus pagos" />
      <div
        className="flex flex-1 flex-col justify-center gap-2 p-2.5"
        role="radiogroup"
        aria-label="Plan de pagos"
      >
        {HERO_PLANS.map((p) => {
          const active = p.id === sandbox.plan;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => controls.act({ type: "choosePlan", plan: p.id })}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-colors active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                active ? "border-accent bg-accent/8" : "border-border bg-surface hover:border-accent/40"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                  active ? "border-accent bg-accent" : "border-border"
                }`}
                aria-hidden
              >
                {active && (
                  <Check className="h-2 w-2 text-accent-foreground" strokeWidth={4} />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[11px] font-bold leading-tight text-foreground">
                  {p.label}
                </span>
                <span className="block truncate text-[10px] leading-tight text-muted-foreground">
                  {p.detail}
                </span>
              </span>
              <span className="shrink-0 text-[11px] font-bold tabular-nums text-foreground">
                {formatPlanCharge(p)}
              </span>
            </button>
          );
        })}
        <p className="text-center text-[10px] text-muted-foreground">
          Autorizas tu tarjeta una sola vez
        </p>
      </div>
      <PhoneFooter
        label={
          plan.installments
            ? `Pagar en ${plan.installments} · ${charge}`
            : `Suscribirme · ${charge}`
        }
        icon={CreditCard}
        onClick={() => controls.act({ type: "subscribe" })}
      />
    </>
  );
}
