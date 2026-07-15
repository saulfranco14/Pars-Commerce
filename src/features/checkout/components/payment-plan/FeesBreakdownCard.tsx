"use client";

import {
  freqPeriodLabel,
  type CartFrequency,
} from "@/features/checkout/helpers/cartFrequency";
import type { FeeBreakdown } from "@/features/checkout/hooks/usePaymentMode";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface FeesBreakdownCardProps {
  paymentMode: PaymentMode;
  feeBreakdown: FeeBreakdown;
  selectedFrequency: CartFrequency;
  feeAbsorbedBy: "customer" | "business";
}

export function FeesBreakdownCard({
  paymentMode,
  feeBreakdown,
  selectedFrequency,
  feeAbsorbedBy,
}: FeesBreakdownCardProps) {
  return (
    <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
      {feeBreakdown.discountPercent > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-green-700">
            Descuento suscripción ({feeBreakdown.discountPercent}%)
          </span>
          <span className="font-medium tabular-nums text-green-700">
            -${feeBreakdown.discountAmount.toFixed(2)}
          </span>
        </div>
      )}
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">
          Cobro {freqPeriodLabel(selectedFrequency)}
        </span>
        <span className="font-bold tabular-nums text-gray-900">
          ${feeBreakdown.chargePerPeriod.toFixed(2)}
        </span>
      </div>
      {feeAbsorbedBy === "customer" && feeBreakdown.serviceFee > 0 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>Tarifa de servicio incluida</span>
          <span className="tabular-nums">
            ${feeBreakdown.serviceFee.toFixed(2)}
          </span>
        </div>
      )}
      {feeBreakdown.totalPayments && (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Cobros</span>
            <span className="tabular-nums">{feeBreakdown.totalPayments}</span>
          </div>
          <div className="border-t border-gray-100 pt-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-700">Total de abonos</span>
              <span className="font-bold tabular-nums text-gray-900">
                ${feeBreakdown.totalPaid!.toFixed(2)}
              </span>
            </div>
          </div>
        </>
      )}
      {paymentMode === "recurring" && (
        <p className="pt-1 text-xs text-gray-500">
          Cancela cuando quieras sin penalización.
        </p>
      )}
    </div>
  );
}
