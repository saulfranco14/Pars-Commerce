"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, RefreshCw } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";

interface PaymentReceiptProps {
  amount: number;
  method: CustomerPayMethod;
  paidAt: string;
  businessName?: string;
  tableLabel?: string;
  status: "approved" | "pending_validation";
  onClose: () => void;
  onRefresh?: () => void | Promise<void>;
  refreshing?: boolean;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es-MX", {
      day: "2-digit",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function PaymentReceipt({
  amount,
  method,
  paidAt,
  businessName,
  tableLabel,
  status,
  onClose,
  onRefresh,
  refreshing = false,
}: PaymentReceiptProps) {
  const meta = PAYMENT_METHOD_META[method];
  const Icon = meta.icon;
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(t);
  }, []);

  const isApproved = status === "approved";

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-xl">
      {/* HERO — unified accent color, no orange */}
      <div
        className={`relative px-6 pb-8 pt-10 text-center ${
          isApproved
            ? "bg-emerald-600 text-white"
            : "bg-accent text-accent-foreground"
        }`}
      >
        {/* Animated icon */}
        <div
          className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-500 ${
            animated ? "scale-100" : "scale-0"
          }`}
        >
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-700 ${
              animated ? "scale-100" : "scale-0"
            }`}
          >
            {isApproved ? (
              <Check
                className="h-8 w-8 text-emerald-600"
                strokeWidth={3}
                aria-hidden
              />
            ) : (
              <Loader2
                className="h-7 w-7 animate-spin text-accent"
                strokeWidth={2.5}
                aria-hidden
              />
            )}
          </div>
        </div>

        <h1 className="mt-5 text-xl font-bold">
          {isApproved ? "¡Pago confirmado!" : "Pago registrado"}
        </h1>
        <p className="mt-1 text-sm opacity-90">
          {isApproved
            ? "Gracias por tu pago"
            : `${businessName ?? "El negocio"} confirmará en un momento`}
        </p>

        <div className="mt-5 inline-flex items-baseline gap-1 rounded-2xl bg-white/15 px-5 py-3 backdrop-blur-sm">
          <span className="text-2xl font-bold tracking-tight">
            {formatCurrency(amount)}
          </span>
        </div>
      </div>

      {/* DETAILS */}
      <div className="space-y-1 px-6 py-5">
        {businessName && <Row label="Negocio" value={businessName} />}
        {tableLabel && <Row label="Mesa" value={tableLabel} />}
        <Row
          label="Método"
          value={
            <span className="inline-flex items-center gap-1.5">
              <Icon className="h-4 w-4" />
              {meta.label}
            </span>
          }
        />
        <Row label="Fecha" value={formatDate(paidAt)} />
        <Row
          label="Estado"
          value={
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-accent/10 text-accent"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isApproved ? "bg-emerald-500" : "bg-accent"
                }`}
              />
              {isApproved ? "Aprobado" : "Esperando confirmación"}
            </span>
          }
        />
      </div>

      {/* Ticket separator */}
      <div
        aria-hidden
        className="relative h-6"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12px 0, transparent 12px, var(--surface, white) 13px)",
        }}
      >
        <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 border-t border-dashed border-border" />
      </div>

      {/* Actions */}
      <div className="space-y-2 px-6 pb-6">
        {/* When pending: primary CTA is "Verificar estado" */}
        {!isApproved && onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
          >
            {refreshing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                Verificar estado
              </>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={onClose}
          className={`flex min-h-[52px] w-full cursor-pointer items-center justify-center rounded-2xl px-4 py-3 text-base font-bold transition-all active:scale-[0.99] ${
            isApproved
              ? "bg-accent text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90"
              : "border border-border bg-surface text-foreground hover:bg-border-soft/40"
          }`}
        >
          {isApproved ? "Listo" : "Volver a la cuenta"}
        </button>

        {!isApproved && (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Esta pantalla se actualizará automáticamente cuando el negocio
            confirme tu pago.
          </p>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-soft/60 py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
