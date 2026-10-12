"use client";

import { ShieldCheck } from "lucide-react";
import type { CheckoutPaymentMethod } from "@/features/checkout/interfaces/publicCheckout";

interface DesktopCheckoutAsideProps {
  children: React.ReactNode;
  footerId: string;
  paymentMethod: CheckoutPaymentMethod;
  totalUnits: number;
  total: number;
}

export function DesktopCheckoutAside({ children, footerId, paymentMethod, totalUnits, total }: DesktopCheckoutAsideProps) {
  const securityMessage =
    paymentMethod === "bank_transfer"
      ? "El comprobante se valida antes de preparar el pedido."
      : paymentMethod === "cash"
        ? "Pagarás directamente cuando recojas tu pedido."
        : "Pago seguro y protegido con Mercado Pago.";
  return (
    <aside className="hidden xl:sticky xl:top-6 xl:block">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="shrink-0 px-5 pb-4 pt-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Finalizar pedido</h2>
            <p className="mt-0.5 text-xs text-gray-500">{totalUnits} {totalUnits === 1 ? "pieza" : "piezas"}</p>
          </div>
          <p className="text-lg font-black tabular-nums text-gray-950">${total.toFixed(2)}</p>
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
          <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
          <p className="text-xs text-gray-600">{securityMessage}</p>
        </div>
        </div>
        <div className="px-5 pb-5">{children}</div>
        <div id={footerId} className="shrink-0" />
      </div>
    </aside>
  );
}
