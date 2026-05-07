"use client";

import type { MsiOption } from "@/constants/commissionConfig";

import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface MsiBreakdownCardProps {
  paymentMode: PaymentMode;
  msiOption: MsiOption;
  total: number;
  perMonth: number;
  mpFee: number;
  feeAbsorbedBy: "customer" | "business";
  accentColor: string;
}

export function MsiBreakdownCard({
  paymentMode,
  msiOption,
  total,
  perMonth,
  mpFee,
  feeAbsorbedBy,
  accentColor,
}: MsiBreakdownCardProps) {
  if (msiOption <= 1) return null;

  return (
    <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="text-gray-600">
          {paymentMode === "installments" ? "Primer abono" : "Total a pagar"}
        </span>
        <span className="font-bold tabular-nums" style={{ color: accentColor }}>
          ${total.toFixed(2)}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-600">{msiOption} cuotas mensuales de</span>
        <span className="font-semibold tabular-nums text-gray-900">
          ${perMonth.toFixed(2)}
        </span>
      </div>
      {feeAbsorbedBy === "customer" && (
        <div className="flex items-center justify-between text-gray-500">
          <span>Comisión MSI incluida</span>
          <span className="tabular-nums">${mpFee.toFixed(2)}</span>
        </div>
      )}
      <p className="pt-1 text-[10px] leading-relaxed text-gray-500">
        Solo aplica a tarjetas de crédito participantes en MSI.
      </p>
    </div>
  );
}
