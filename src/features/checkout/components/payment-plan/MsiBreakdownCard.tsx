"use client";

import type { MsiOption } from "@/constants/commissionConfig";

import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface MsiBreakdownCardProps {
  paymentMode: PaymentMode;
  msiOption: MsiOption;
  total: number;
  subtotal: number;
  perMonth: number;
  mpFee: number;
  feeAbsorbedBy: "customer" | "business";
  accentColor: string;
}

/**
 * Tarjeta de desglose de comisiones para MSI y Contado.
 *
 * Para MSI (≥3): muestra el total, las cuotas y la comisión incluida.
 * Para Contado: muestra la comisión si el cliente la absorbe, o bien
 * indica que el negocio la cubre cuando la absorbe él.
 */
export function MsiBreakdownCard({
  paymentMode,
  msiOption,
  total,
  subtotal,
  perMonth,
  mpFee,
  feeAbsorbedBy,
  accentColor,
}: MsiBreakdownCardProps) {
  const isContado = msiOption === 1;
  const customerAbsorbs = feeAbsorbedBy === "customer";
  const hasFee = mpFee > 0;

  // Para Contado con negocio absorbiendo: solo mostrar nota informativa
  if (isContado && !customerAbsorbs) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50/60 px-3 py-2.5 text-xs text-gray-500">
        <span className="mt-px shrink-0">ℹ️</span>
        <p>
          Mercado Pago cobra una comisión de procesamiento (~
          {((mpFee / subtotal) * 100).toFixed(1)}%) que cubre el negocio. Tu
          precio final es{" "}
          <strong className="text-gray-700">${subtotal.toFixed(2)}</strong>.
        </p>
      </div>
    );
  }

  // Para Contado con cliente absorbiendo: mostrar el desglose del cobro
  if (isContado && customerAbsorbs && hasFee) {
    return (
      <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Total a pagar</span>
          <span
            className="font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>Precio del producto</span>
          <span className="tabular-nums">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-gray-500">
          <span>Tarifa de servicio</span>
          <span className="tabular-nums">+${mpFee.toFixed(2)}</span>
        </div>
      </div>
    );
  }

  // Para MSI (≥3)
  if (!isContado) {
    return (
      <div className="space-y-1.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">
            {paymentMode === "installments" ? "Primer abono" : "Total a pagar"}
          </span>
          <span
            className="font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            ${total.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-600">{msiOption} cuotas mensuales de</span>
          <span className="font-semibold tabular-nums text-gray-900">
            ${perMonth.toFixed(2)}
          </span>
        </div>
        {customerAbsorbs && hasFee && (
          <div className="flex items-center justify-between text-gray-500">
            <span>Comisión MSI incluida</span>
            <span className="tabular-nums">+${mpFee.toFixed(2)}</span>
          </div>
        )}
        <p className="pt-1 text-[10px] leading-relaxed text-gray-500">
          Solo aplica a tarjetas de crédito participantes en MSI.
        </p>
      </div>
    );
  }

  return null;
}
