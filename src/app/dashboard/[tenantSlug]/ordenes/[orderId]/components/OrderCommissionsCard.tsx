"use client";

import { useOrder } from "../hooks/useOrder";
import { TARIFA_DE_SERVICIO_LABEL } from "@/constants/commissionConfig";

export function OrderCommissionsCard() {
  const { order } = useOrder();

  if (!order || order.payment_method !== "mercadopago" || order.status !== "paid") {
    return null;
  }

  const payments = order.payments as { amount: number; metadata?: { mp_fee_amount?: number; pars_fee_amount?: number } }[] | undefined;
  const mpPayment = Array.isArray(payments) ? payments.find((p) => p.provider === "mercadopago") : null;
  const metadata = mpPayment?.metadata;
  const transactionAmount = mpPayment?.amount ?? Number(order.total);
  const mpFee = metadata?.mp_fee_amount ?? 0;
  const parsFee = metadata?.pars_fee_amount ?? 0;
  const vendorReceived = Number(order.total);

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-sm">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Desglose de pagos – Mercado Pago
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Total de la orden (recibido)
          </span>
          <span className="tabular-nums font-medium">
            ${vendorReceived.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Comisión Mercado Pago</span>
          <span className="tabular-nums">${mpFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{TARIFA_DE_SERVICIO_LABEL}</span>
          <span className="tabular-nums">${parsFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-border pt-2 text-sm font-semibold">
          <span className="text-muted-foreground">Total pagado por el cliente</span>
          <span className="tabular-nums">${transactionAmount.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
