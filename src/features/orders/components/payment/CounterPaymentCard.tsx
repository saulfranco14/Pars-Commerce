"use client";

import { useState } from "react";
import { QrCode, Store, Wallet } from "lucide-react";

import { useOrder } from "@/features/orders/hooks/useOrder";
import { ChargeSheet } from "@/features/orders/components/payment/ChargeSheet";
import { btnWorkSuccess } from "@/components/ui/buttonClasses";
import { formatCurrency } from "@/features/qr/helpers/format";
import { usePermission } from "@/stores/useTenantStore";
import { isTableServiceOrder } from "@/features/orders/helpers/isTableServiceOrder";
import { orderAmountDue } from "@/features/orders/helpers/orderAmountDue";

/** Orígenes donde el negocio registra un cobro directo en mostrador. */
const COUNTER_SOURCES = new Set(["staff"]);

/**
 * Los pedidos creados por personal se cobran desde esta tarjeta. Un pedido de
 * kiosco se paga en el QR del cliente; si eligió un método manual, su
 * validación aparece en PendingCashCard.
 */
export function CounterPaymentCard() {
  const { order, team, fetchOrder } = useOrder();
  const can = usePermission();
  const [charging, setCharging] = useState(false);

  if (!order) return null;
  const isTableOrder = isTableServiceOrder(order);
  const isKioskOrder = order.source === "kiosk" && !isTableOrder;
  if (!isKioskOrder && !isTableOrder && !COUNTER_SOURCES.has(order.source ?? "")) return null;
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

  const due = orderAmountDue(order);
  const number = order.order_number ?? order.id.slice(0, 8).toUpperCase();

  return (
    <div className="min-w-0 rounded-xl border border-emerald-300 bg-emerald-50/60 p-4 dark:border-emerald-800 dark:bg-emerald-950/30">
      <div className="mb-1 flex items-center gap-2">
        <Store className="h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden />
        <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Cobrar en el mostrador</h3>
      </div>
      <p className="mb-3 text-xs text-emerald-900/80 dark:text-emerald-200/80">
        El cliente trae su número <span className="font-mono font-bold">{number}</span> y paga aquí.
      </p>
      <button type="button" onClick={() => setCharging(true)} className={`${btnWorkSuccess} w-full`}>
        <Wallet className="h-4 w-4" aria-hidden />
        Cobrar {formatCurrency(due)}
      </button>

      <ChargeSheet
        target={
          charging
            ? { id: order.id, number, due, customerName: order.customer_name, assignedTo: order.assigned_to }
            : null
        }
        team={team.map((member) => ({ userId: member.user_id, name: member.display_name || member.email }))}
        onClose={() => setCharging(false)}
        onCharged={() => void fetchOrder()}
      />
    </div>
  );
}
