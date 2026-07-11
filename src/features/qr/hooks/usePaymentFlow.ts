"use client";

import { useState } from "react";

import {
  createMpPreference,
  createPaymentIntent,
} from "@/features/qr/services/tableClientService";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";
import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

export type PayTarget =
  | { kind: "full"; amount: number }
  | { kind: "group"; group: SplitGroup };

export interface PendingPayment {
  paymentId: string | null;
  splitGroupId: string;
  method: CustomerPayMethod;
  amount: number;
  submittedAt: string;
}

interface UsePaymentFlowParams {
  orderId: string;
  qrToken: string;
  fingerprint: string;
  onSubmitted?: () => void | Promise<void>;
}

/**
 * State machine for the customer payment flow on the bill page. Collapsed to
 * a single sheet (DESIGN_SYSTEM.md §4.4): picking a target opens
 * <CustomerPayModal>, and method selection + confirmation both happen inside
 * that one sheet:
 *
 *   bill
 *    └── pickTarget(target)          // user taps "Pagar" / "Pagar grupo"
 *         └── confirmIntent(method)  // confirmed from within the sheet
 *              └── pending shown via PaymentReceipt (manual methods)
 *                  or hard-redirect to Mercado Pago
 */
export function usePaymentFlow({
  orderId,
  qrToken,
  fingerprint,
  onSubmitted,
}: UsePaymentFlowParams) {
  const [target, setTarget] = useState<PayTarget | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingPayment | null>(null);

  function pickTarget(t: PayTarget | null) {
    setTarget(t);
    setError(null);
  }

  function dismissPending() {
    setPending(null);
  }

  async function confirmIntent(method: CustomerPayMethod, customerPhone?: string) {
    if (!target) return;
    const amount =
      target.kind === "group"
        ? Number(target.group.balance_due || target.group.total)
        : target.amount;

    setSubmitting(true);
    setError(null);
    try {
      if (method === "mercadopago") {
        const pref = await createMpPreference({
          orderId,
          groupId: target.kind === "group" ? target.group.id : null,
          qrToken,
        });
        // Hard redirect to Mercado Pago checkout. The customer comes back to
        // /q/{token}/table/payment/result?... which polls until paid.
        window.location.href = pref.init_point;
        return;
      }

      const result = await createPaymentIntent({
        orderId,
        groupId: target.kind === "group" ? target.group.id : null,
        method,
        fingerprint,
        customerPhone: customerPhone ?? null,
      });
      setPending({
        paymentId: result.payment_id,
        splitGroupId: result.split_group_id,
        method,
        amount,
        submittedAt: new Date().toISOString(),
      });
      setTarget(null);
      if (onSubmitted) await onSubmitted();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error inesperado al pagar.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return {
    /* state */
    target,
    submitting,
    error,
    pending,
    /* transitions */
    pickTarget,
    confirmIntent,
    dismissPending,
  };
}
