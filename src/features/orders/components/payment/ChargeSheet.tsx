"use client";

import { ArrowLeft, CheckCircle2, Loader2, Lock, UserRound, Wallet } from "lucide-react";

import { useCounterCharge } from "@/features/orders/hooks/useCounterCharge";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { btnWorkPrimary, btnWorkSecondary } from "@/components/ui/buttonClasses";
import { OPTION_CARD } from "@/components/wizard/wizardStyles";

import { formatCurrency } from "@/features/qr/helpers/format";
import { COUNTER_PAYMENT_METHODS, paymentMethodLabel } from "@/features/orders/constants/paymentMethods";

import type { ChargeSheetProps } from "@/features/orders/interfaces/chargeSheet";

const methodLabel = (id: string | null) => {
  const found = COUNTER_PAYMENT_METHODS.find((entry) => entry.id === id);
  return found ? paymentMethodLabel(found.label).toLowerCase() : "";
};

/**
 * The one way to charge at the counter (Caja and the order page): who
 * attended if nobody is assigned, how the money came in, and a clear "Cobrado".
 */
export function ChargeSheet({ target, team, onClose, onCharged }: ChargeSheetProps) {
  const flow = useCounterCharge(target, team.length > 0, onCharged);
  const due = target?.due ?? 0;
  const methods = flow.lockedMethod ? COUNTER_PAYMENT_METHODS.filter((entry) => entry.id === flow.lockedMethod) : COUNTER_PAYMENT_METHODS;

  const footer =
    flow.step === "done" ? (
      <button type="button" onClick={onClose} className={`${btnWorkPrimary} w-full`}>
        Listo
      </button>
    ) : flow.step === "method" ? (
      <div className="flex gap-2">
        {flow.backToAttendant ? (
          <button type="button" onClick={flow.backToAttendant} disabled={flow.busy} className={btnWorkSecondary} aria-label="Cambiar quién atendió">
            <ArrowLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
        <button type="button" disabled={!flow.method || flow.busy} onClick={() => void flow.charge()} className={`${btnWorkPrimary} flex-1`}>
          {flow.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Wallet className="h-4 w-4" aria-hidden />}
          {flow.busy ? "Registrando cobro…" : flow.method ? `Recibí ${formatCurrency(due)} en ${methodLabel(flow.method)}` : "Elige cómo te pagó"}
        </button>
      </div>
    ) : null;

  return (
    <FormSheet
      isOpen={Boolean(target)}
      onClose={onClose}
      dismissible={!flow.busy}
      icon={Wallet}
      title={target ? `Cobrar #${target.number}` : "Cobrar"}
      description={[target?.originLabel, target?.customerName].filter(Boolean).join(" · ")}
      maxWidth="max-w-md"
      footer={footer}
    >
      {flow.step === "done" && flow.result ? (
        <div className="flex flex-col items-center py-6 text-center" role="status">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
            <CheckCircle2 className="h-9 w-9 text-emerald-600" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Cobrado</p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(flow.result.amount)}</p>
          <p className="mt-2 text-sm text-muted-foreground">En {methodLabel(flow.result.method)}. El cliente ya ve su pedido pagado.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Por cobrar</p>
            <p className="mt-1 text-5xl font-bold tracking-tight text-foreground tabular-nums">{formatCurrency(due)}</p>
          </div>

          {flow.error ? <Notification tone="error" message={flow.error} /> : null}

          {flow.step === "attendant" ? (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-foreground">¿Quién lo atendió?</legend>
              <div className="space-y-2">
                {team.map((member) => (
                  <button
                    key={member.userId}
                    type="button"
                    onClick={() => flow.chooseAttendant(member.userId)}
                    className={`${OPTION_CARD.base} ${OPTION_CARD.idle} flex min-h-14 w-full items-center gap-3 bg-surface px-4`}
                  >
                    <UserRound className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="font-semibold text-foreground">{member.name}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Así su venta y su propina quedan a su nombre.</p>
            </fieldset>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-foreground">
                {flow.lockedMethod ? "El cliente eligió pagar en" : "¿Cómo te pagó?"}
              </legend>
              <div className={`grid gap-2 ${methods.length === 1 ? "grid-cols-1" : "grid-cols-3"}`} role="radiogroup" aria-label="Cómo te pagó">
                {methods.map(({ id, label, icon: Icon }) => {
                  const active = flow.method === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      disabled={flow.busy}
                      onClick={() => flow.chooseMethod(id)}
                      className={`${OPTION_CARD.base} ${active ? OPTION_CARD.selected : OPTION_CARD.idle} flex min-h-24 flex-col items-center justify-center gap-2 bg-surface p-3 disabled:opacity-60`}
                    >
                      <Icon className={`h-6 w-6 ${active ? "text-accent" : "text-muted-foreground"}`} aria-hidden />
                      <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                        {paymentMethodLabel(label)}
                        {flow.lockedMethod ? <Lock className="h-3.5 w-3.5 text-muted-foreground" aria-hidden /> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                {flow.lockedMethod ? "Es el método que eligió al comprar; no se cambia aquí." : "Confirma solo con el dinero en la mano."}
              </p>
            </fieldset>
          )}
        </div>
      )}
    </FormSheet>
  );
}
