"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";
import {
  PAYMENT_METHOD_META,
  PAYMENT_METHOD_ORDER,
} from "@/features/qr/constants/paymentMethodMeta";
import { PaymentMethodStep } from "@/features/qr/components/payment/PaymentMethodStep";

export type CustomerPayMethod =
  | "efectivo"
  | "transferencia"
  | "tarjeta"
  | "mercadopago";

interface CustomerPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    method: CustomerPayMethod,
    customerPhone?: string,
  ) => Promise<void> | void;
  total: number;
  tenantId: string;
  tenantName: string;
  tableLabel?: string;
  loading?: boolean;
  error?: string | null;
  description?: string;
  /** Ask an anonymous customer for a phone on manual methods (order tickets). */
  requirePhone?: boolean;
}

/**
 * Mobile-first payment sheet that owns the whole flow (DESIGN_SYSTEM.md §4.4):
 *
 *   View 1 — method picker: amount protagonist + method rows (monochrome,
 *            accent only on the active row). Tapping a row advances.
 *   View 2 — method details + confirm: reuses <PaymentMethodStep> so the
 *            transferencia bank details (+ no-account guard), cash/card
 *            instructions and Mercado Pago blurb all stay inside the sheet.
 *
 * On mobile it's a full-width bottom sheet pinned to the viewport bottom; on
 * desktop a centered modal. The confirm action lives at the bottom, always
 * visible. Presentational shell — HTTP/redirect logic stays in usePaymentFlow.
 */
export function CustomerPayModal({
  isOpen,
  onClose,
  onConfirm,
  total,
  tenantId,
  tenantName,
  tableLabel,
  loading = false,
  error,
  description,
  requirePhone = false,
}: CustomerPayModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<CustomerPayMethod | null>(null);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (isOpen) setSelected(null);
  }, [isOpen]);
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose, loading]);

  if (!mounted || !isOpen) return null;

  const showingDetails = selected !== null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 md:items-center md:justify-center md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="customer-pay-title"
      onClick={loading ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl md:max-h-[88vh] md:max-w-md md:rounded-3xl md:border md:border-border"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>

        {/* Header — amount protagonist */}
        <div className="shrink-0 px-5 pb-4 pt-4 md:px-6 md:pt-6">
          {showingDetails && (
            <button
              type="button"
              onClick={() => !loading && setSelected(null)}
              disabled={loading}
              className="mb-2 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Cambiar método
            </button>
          )}
          <h2
            id="customer-pay-title"
            className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground"
          >
            {showingDetails
              ? `Pago con ${PAYMENT_METHOD_META[selected].label}`
              : "Pagar mi cuenta"}
          </h2>
          <p className="mt-0.5 text-4xl font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </p>
          {description && !showingDetails && (
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        <div className="mx-5 border-t border-border-soft md:mx-6" />

        {/* Body — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 md:px-6">
          {showingDetails ? (
            <PaymentMethodStep
              method={selected}
              amount={total}
              tenantId={tenantId}
              tenantName={tenantName}
              tableLabel={tableLabel}
              requirePhone={requirePhone}
              onConfirm={async (phone) => {
                await onConfirm(selected, phone);
              }}
              onBack={() => setSelected(null)}
              loading={loading}
              error={error}
            />
          ) : (
            <>
              <p className="mb-3 text-sm font-bold text-foreground">
                ¿Cómo quieres pagar?
              </p>
              <div className="space-y-2">
                {PAYMENT_METHOD_ORDER.map((id) => {
                  const meta = PAYMENT_METHOD_META[id];
                  const Icon = meta.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSelected(id)}
                      className="group flex w-full min-h-[64px] cursor-pointer items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 text-left transition-colors hover:border-accent hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-border-soft/60 text-muted-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                        <Icon className="h-5 w-5" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-foreground">
                          {meta.pickerLabel}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {meta.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                Pago seguro
              </p>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
