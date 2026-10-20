import { CreditCard } from "lucide-react";

import {
  PhoneFooter,
  PhoneHero,
  PhoneLink,
} from "@/features/landing/components/hero/phone/PhoneParts";

import { HERO_LOAN } from "@/features/landing/constants/heroSandbox";
import { formatMXN } from "@/lib/loanUtils";

import type { HeroPhoneViewProps } from "@/features/landing/interfaces/heroDemo";

export function LoanView({ sandbox, controls }: HeroPhoneViewProps) {
  const { installments, amount, initialPaid } = HERO_LOAN;
  const paid = sandbox.loanPaid;
  const justPaid = paid > initialPaid;
  const remaining = installments - paid;
  const pay = () => controls.act({ type: "payLoan" });

  return (
    <>
      <PhoneHero
        kicker="Tu crédito"
        title={justPaid ? `Abono ${paid} de ${installments} pagado` : `Abono ${paid + 1} de ${installments}`}
      />
      <div className="flex flex-1 flex-col justify-center gap-3 p-3 text-center">
        <div key={paid} className="animate-hero-row-in">
          <p
            className={`text-[10px] font-bold uppercase tracking-wider ${
              justPaid ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
            }`}
          >
            {justPaid ? "Abonaste" : "Tu abono de hoy"}
          </p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            {formatMXN(amount)}
          </p>
        </div>
        <div>
          <div className="flex gap-1" aria-hidden>
            {Array.from({ length: installments }, (_, i) => (
              <span
                key={i}
                className={`h-2 flex-1 rounded-full transition-colors duration-500 ${
                  i < paid
                    ? "bg-accent"
                    : i === paid && !justPaid
                      ? "animate-hero-live-pulse bg-accent/40"
                      : "bg-border"
                }`}
              />
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {remaining > 0
              ? `Te faltan ${remaining} abonos · ${formatMXN(remaining * amount)}`
              : "Crédito liquidado"}
          </p>
        </div>
        {justPaid && remaining > 0 ? (
          <PhoneLink onClick={pay}>Adelantar otro abono</PhoneLink>
        ) : (
          <div className="rounded-xl border border-border bg-surface px-2.5 py-2 text-left">
            <p className="text-[10px] text-muted-foreground">Próximo abono</p>
            <p className="text-[11px] font-bold text-foreground">8 de agosto · automático</p>
          </div>
        )}
      </div>
      {justPaid || remaining === 0 ? (
        <PhoneFooter label={`Siguiente: ${controls.nextLabel}`} onClick={controls.next} />
      ) : (
        <PhoneFooter
          label={`Pagar mi abono · ${formatMXN(amount)}`}
          icon={CreditCard}
          onClick={pay}
        />
      )}
    </>
  );
}
