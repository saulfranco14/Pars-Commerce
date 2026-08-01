"use client";

import { useState } from "react";
import { Loader2, QrCode, Store } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { PAYMENT_METHODS } from "@/features/orders/constants/paymentMethods";
import { useOrder } from "@/features/orders/hooks/useOrder";
import { chargeOrderAtCounter } from "@/features/orders/services/counterPaymentClientService";
import { formatCurrency } from "@/features/qr/helpers/format";
import { usePermission } from "@/stores/useTenantStore";

import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

/** Mercado Pago no va: ese cobro lo hace el cliente desde su teléfono. */
const COUNTER_METHODS = PAYMENT_METHODS.filter(
  (m) => m.id !== "mercadopago",
) as ReadonlyArray<
  (typeof PAYMENT_METHODS)[number] & { id: IntentMethod }
>;

/** Orígenes donde el negocio registra un cobro directo en mostrador. */
const COUNTER_SOURCES = new Set(["staff"]);

/**
 * Los pedidos creados por personal se cobran desde esta tarjeta. Un pedido de
 * kiosco se paga en el QR del cliente; si eligió un método manual, su
 * validación aparece en PendingCashCard.
 */
export function CounterPaymentCard() {
  const { order, fetchOrder } = useOrder();
  const can = usePermission();
  const [method, setMethod] = useState<IntentMethod | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;
  const isKioskOrder = order.source === "kiosk";
  if (!isKioskOrder && !COUNTER_SOURCES.has(order.source ?? "")) return null;
  if (["paid", "completed", "cancelled"].includes(order.status)) return null;

  // Ya hay dinero esperando validación: eso se resuelve en la otra tarjeta.
  const hasPending = (order.payments ?? []).some(
    (p) => p.provider === "manual" && p.status === "pending",
  );
  if (hasPending) return null;

  // Creating or scanning a kiosk ticket does not prove that money was
  // received. Its manual payment is confirmed only by PendingCashCard.
  if (isKioskOrder) {
    return (
      <div className="min-w-0 rounded-xl border border-blue-200 bg-blue-50/60 p-4">
        <div className="flex items-center gap-2">
          <QrCode className="h-5 w-5 shrink-0 text-blue-700" aria-hidden />
          <h3 className="text-sm font-bold text-blue-950">
            Pedido de autoservicio
          </h3>
        </div>
        <p className="mt-1 text-xs leading-5 text-blue-950/75">
          El cliente paga desde el QR de su ticket. Cuando registre efectivo,
          transferencia o tarjeta, aparecerá arriba para que confirmes el
          dinero recibido.
        </p>
        <p className="mt-2 text-xs font-medium text-blue-900">
          Ticket {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
        </p>
      </div>
    );
  }

  // Sin permiso NO se esconde la tarjeta: desaparecer sin decir nada deja a quien
  // atiende buscando un botón que nunca va a existir para su rol.
  if (!can("payments.write")) {
    return (
      <div className="min-w-0 rounded-xl border border-border bg-surface-raised p-4">
        <div className="flex items-center gap-2">
          <Store
            className="h-4 w-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <h3 className="text-sm font-semibold text-foreground">
            Cobrar en el mostrador
          </h3>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Tu rol no puede registrar cobros. Lo hacen el propietario y el cajero.
        </p>
      </div>
    );
  }

  const due = Number(order.balance_due ?? order.total);

  async function charge() {
    if (!method) return;
    setBusy(true);
    setError(null);
    try {
      await chargeOrderAtCounter(order!.id, method);
      await fetchOrder();
      setMethod(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo registrar el cobro",
      );
    } finally {
      setBusy(false);
    }
  }

  const chosen = COUNTER_METHODS.find((m) => m.id === method);

  return (
    <div className="min-w-0 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4">
      <div className="mb-1 flex items-center gap-2">
        <Store className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden />
        <h3 className="text-sm font-bold text-emerald-900">
          Cobrar en el mostrador
        </h3>
      </div>
      <p className="mb-3 text-xs text-emerald-900/80">
        El cliente trae su número{" "}
        <span className="font-mono font-bold">
          {order.order_number ?? order.id.slice(0, 8).toUpperCase()}
        </span>{" "}
        y paga aquí. Cobra {formatCurrency(due)} y elige cómo lo recibiste.
      </p>

      {error && (
        <div className="mb-3">
          <Notification tone="error" message={error} />
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {COUNTER_METHODS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setMethod(id)}
            disabled={busy}
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-emerald-300 bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:border-emerald-500 hover:bg-emerald-50 disabled:opacity-60"
          >
            {busy && method === id ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
            ) : (
              <Icon className="h-4 w-4 shrink-0 text-emerald-700" aria-hidden />
            )}
            {label.charAt(0) + label.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      <ConfirmDialog
        isOpen={method !== null}
        onClose={() => setMethod(null)}
        onConfirm={charge}
        title={`¿Recibiste ${formatCurrency(due)}?`}
        description={`Se registra el cobro en ${chosen ? chosen.label.toLowerCase() : ""} y el pedido queda pagado. Confirma solo con el dinero en la mano.`}
        confirmLabel="Sí, ya lo recibí"
        loading={busy}
      />
    </div>
  );
}
