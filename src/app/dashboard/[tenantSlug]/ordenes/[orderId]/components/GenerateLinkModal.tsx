"use client";

import { calcBuyerTotal, TARIFA_DE_SERVICIO_LABEL } from "@/constants/commissionConfig";
import { Link } from "lucide-react";

interface GenerateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  vendorTotal: number;
  loading?: boolean;
}

export function GenerateLinkModal({
  isOpen,
  onClose,
  onConfirm,
  vendorTotal,
  loading = false,
}: GenerateLinkModalProps) {
  if (!isOpen) return null;

  const { total: buyerTotal, mpFee, parsFee } = calcBuyerTotal(vendorTotal);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    await onConfirm();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col justify-end md:items-center md:justify-center bg-black/60 p-0 md:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="generate-link-title"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[92vh] max-w-md flex flex-col overflow-hidden rounded-t-2xl border-t border-border-soft bg-surface-raised shadow-lg md:max-h-none md:rounded-xl md:border"
        onClick={(e) => e.stopPropagation()}
        style={{
          paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
        }}
      >
        <div className="flex shrink-0 justify-center pt-3 md:hidden">
          <div
            className="h-1 w-12 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-2 md:pt-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
              <Link className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="generate-link-title"
                className="text-lg font-semibold text-foreground"
              >
                Generar link de pago
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                El cliente verá este desglose en Mercado Pago.
              </p>
            </div>
          </div>

          <form
            id="generate-link-form"
            onSubmit={handleSubmit}
            className="mt-6 space-y-4"
          >
            <div className="rounded-lg border border-border bg-background/40 px-4 py-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Total de la venta (recibirás)
                  </span>
                  <span className="tabular-nums font-medium">
                    ${vendorTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    Comisión Mercado Pago (estimada)
                  </span>
                  <span className="tabular-nums">${mpFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {TARIFA_DE_SERVICIO_LABEL}
                  </span>
                  <span className="tabular-nums">${parsFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
                  <span>Total que pagará el cliente</span>
                  <span className="tabular-nums">${buyerTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </form>
        </div>

        <div className="shrink-0 flex flex-col-reverse gap-2 px-4 pt-2 pb-4 md:flex-row md:gap-3 md:px-6 md:pt-4 md:pb-6 md:border-t md:border-border-soft">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-base font-medium text-muted-foreground transition-colors duration-200 hover:bg-border-soft/60 hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:max-w-[140px] md:border md:border-border"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="generate-link-form"
            disabled={loading}
            className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-base font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <Link className="h-5 w-5 shrink-0" aria-hidden />
            {loading ? "Generando…" : "Generar link"}
          </button>
        </div>
      </div>
    </div>
  );
}
