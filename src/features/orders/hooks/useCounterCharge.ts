"use client";

import { useEffect, useState } from "react";

import { update as updateOrder } from "@/services/ordersService";
import { counterMethodFor } from "@/features/orders/helpers/counterMethod";
import { chargeOrderAtCounter } from "@/features/orders/services/counterPaymentClientService";

import type { ChargeResult, ChargeTarget } from "@/features/orders/interfaces/chargeSheet";
import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

export type ChargeStep = "method" | "done";

/** How it was paid (and, optionally, who attended if nobody has it) → charged. One flow for every "Cobrar". */
export function useCounterCharge(target: ChargeTarget | null, hasTeam: boolean, onCharged: (result: ChargeResult) => void) {
  const lockedMethod = counterMethodFor(target?.paymentMethod);
  const canPickAttendant = Boolean(target) && !target?.assignedTo && hasTeam;
  const [step, setStep] = useState<ChargeStep>("method");
  const [attendant, setAttendant] = useState<string | null>(null);
  const [method, setMethod] = useState<IntentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChargeResult | null>(null);

  useEffect(() => {
    setStep("method");
    setAttendant(null);
    setMethod(lockedMethod);
    setError(null);
    setResult(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when another order opens
  }, [target?.id]);

  async function charge() {
    if (!target || !method || busy) return;
    setBusy(true);
    setError(null);
    try {
      if (attendant) {
        const saved = (await updateOrder(target.id, { assigned_to: attendant })) as { assigned_to?: string | null };
        if (saved?.assigned_to !== attendant) throw new Error("No se pudo asignar quién atendió. Vuelve a intentarlo.");
      }
      const charged = await chargeOrderAtCounter(target.id, method);
      const done = { amount: charged.amount ?? target.due, method };
      setResult(done);
      setStep("done");
      onCharged(done);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo registrar el cobro.");
    } finally {
      setBusy(false);
    }
  }

  return {
    step,
    lockedMethod,
    canPickAttendant,
    attendant,
    chooseAttendant: setAttendant,
    method,
    chooseMethod: (next: IntentMethod) => {
      if (!lockedMethod) setMethod(next);
    },
    busy,
    error,
    result,
    charge,
  };
}
