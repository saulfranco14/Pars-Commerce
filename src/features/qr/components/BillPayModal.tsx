"use client";

import { useState } from "react";

import { ConfirmPaymentModal } from "@/features/orders/components/payment/ConfirmPaymentModal";

import type { SplitGroup } from "@/features/qr/interfaces/splitBill";

type CheckoutMethod = "efectivo" | "transferencia" | "tarjeta" | "mercadopago";

function isCheckoutMethod(value: string): value is CheckoutMethod {
  return (
    value === "efectivo" ||
    value === "transferencia" ||
    value === "tarjeta" ||
    value === "mercadopago"
  );
}

interface BillPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: SplitGroup | null;
  onPaid: () => void;
  onError: (message: string) => void;
}

/**
 * Wraps the dashboard's ConfirmPaymentModal so the public bill page reuses the
 * exact same UX/visuals. Calls /api/qr/table/split/{groupId}/checkout and
 * notifies the parent on success.
 */
export function BillPayModal({
  isOpen,
  onClose,
  group,
  onPaid,
  onError,
}: BillPayModalProps) {
  const [loading, setLoading] = useState(false);

  if (!group) return null;

  async function handleConfirm(method: string) {
    if (!group || loading) return;
    if (!isCheckoutMethod(method)) {
      onError("Método de pago no válido");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/qr/table/split/${encodeURIComponent(group.id)}/checkout`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ method }),
        },
      );
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        onError(data.error || "No se pudo procesar el pago.");
        return;
      }
      onPaid();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Error inesperado al pagar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ConfirmPaymentModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      total={Number(group.balance_due || group.total)}
      loading={loading}
    />
  );
}
