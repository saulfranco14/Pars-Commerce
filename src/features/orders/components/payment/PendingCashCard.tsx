"use client";

import { useState } from "react";
import { Banknote, Check, HandCoins, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { usePermission } from "@/stores/useTenantStore";
import {
  confirmManualPayment,
  rejectManualPayment,
} from "@/features/orders/services/manualPaymentService";
import { formatCurrency } from "@/features/qr/helpers/format";

import type { OrderPayment } from "@/features/orders/interfaces/orderDetail";

const METHOD_LABEL: Record<string, string> = {
  efectivo: "en efectivo",
  transferencia: "por transferencia",
  tarjeta: "con tarjeta",
};

/**
 * El cliente dijo que ya pagó en efectivo o por transferencia y espera que el
 * negocio lo confirme. Antes esto solo se veía en la pantalla de Mesas, así que
 * un ticket de mostrador o de pantalla se quedaba sin forma de cerrarse.
 */
export function PendingCashCard() {
  const { order, fetchOrder } = useOrder();
  const can = usePermission();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState<OrderPayment | null>(null);

  if (!order || !can("payments.write")) return null;

  const pending = (order.payments ?? []).filter(
    (p) => p.provider === "manual" && p.status === "pending" && p.id,
  );
  if (pending.length === 0) return null;

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await fetchOrder();
      setRejecting(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo completar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-w-0 rounded-xl border-2 border-amber-400 bg-amber-50 p-4">
      <div className="mb-3 flex items-center gap-2">
        <HandCoins className="h-5 w-5 shrink-0 text-amber-700" aria-hidden />
        <h3 className="text-sm font-bold text-amber-900">
          {pending.length === 1
            ? "El cliente dice que ya pagó"
            : `${pending.length} cobros esperando tu confirmación`}
        </h3>
      </div>

      {error && (
        <div className="mb-3">
          <Notification tone="error" message={error} />
        </div>
      )}

      <ul className="space-y-2">
        {pending.map((p) => (
          <li
            key={p.id}
            className="flex flex-col gap-3 rounded-lg bg-surface p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Banknote className="h-4 w-4 shrink-0" aria-hidden />
                {formatCurrency(Number(p.amount))}{" "}
                {METHOD_LABEL[p.metadata?.method ?? ""] ?? ""}
              </p>
              <p className="text-xs text-muted-foreground">
                Confirma solo cuando tengas el dinero en la mano.
              </p>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => run(() => confirmManualPayment(p.id as string))}
                disabled={busy}
                className="inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60 sm:flex-none"
              >
                <Check className="h-4 w-4 shrink-0" aria-hidden />
                Recibí el dinero
              </button>
              <button
                type="button"
                onClick={() => setRejecting(p)}
                disabled={busy}
                className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors hover:bg-border-soft/60 disabled:opacity-60"
              >
                <X className="h-4 w-4 shrink-0" aria-hidden />
                No llegó
              </button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        isOpen={rejecting !== null}
        onClose={() => setRejecting(null)}
        onConfirm={() =>
          run(() => rejectManualPayment(rejecting!.id as string))
        }
        title="¿El pago no llegó?"
        description="Se descarta el cobro y el pedido vuelve a quedar por pagar. El cliente podrá intentarlo otra vez."
        confirmLabel="Sí, descartarlo"
        variant="danger"
        loading={busy}
      />
    </div>
  );
}
