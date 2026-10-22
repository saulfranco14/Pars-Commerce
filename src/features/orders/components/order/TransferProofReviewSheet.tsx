"use client";

import { useEffect, useState } from "react";
import { useBodyScrollLock } from "@/hooks/useBodyScrollLock";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Loader2,
  X,
  XCircle,
} from "lucide-react";

import { btnDanger, btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";
import type { OrderTransferProof } from "@/features/orders/interfaces/orderDetail";

type TransferProofReviewSheetProps = {
  open: boolean;
  orderId: string;
  orderTotal: number;
  proof: OrderTransferProof | null;
  onClose: () => void;
  onReviewed: () => Promise<void>;
  onError: (message: string) => void;
};

export function TransferProofReviewSheet({
  open,
  orderId,
  orderTotal,
  proof,
  onClose,
  onReviewed,
  onError,
}: TransferProofReviewSheetProps) {
  const [mounted, setMounted] = useState(false);
  const [decision, setDecision] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) {
      setDecision(null);
      setReason("");
      setBusy(false);
    }
  }, [open]);

  useBodyScrollLock(open);
  useEffect(() => {
    if (!open) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [busy, onClose, open]);

  async function review(nextDecision: "approve" | "reject") {
    if (!proof || busy) return;
    if (nextDecision === "reject" && !reason.trim()) {
      setDecision("reject");
      return;
    }

    setBusy(true);
    onError("");
    try {
      const response = await fetch(
        `/api/orders/${orderId}/transferencias/${proof.id}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision: nextDecision,
            rejection_reason: nextDecision === "reject" ? reason.trim() : undefined,
          }),
        },
      );
      const result = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error ?? "No pudimos revisar el comprobante.");
      }
      await onReviewed();
      onClose();
    } catch (error) {
      onError(error instanceof Error ? error.message : "No pudimos revisar el comprobante.");
    } finally {
      setBusy(false);
    }
  }

  if (!mounted || !open || !proof) return null;

  const isImage = proof.file_type.startsWith("image/");

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="proof-review-title"
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={busy ? undefined : onClose}
        aria-label="Cerrar"
      />
      <section className="relative z-10 flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] border border-border bg-surface shadow-2xl sm:max-w-xl sm:rounded-3xl">
        <div className="mx-auto mt-2 h-1 w-12 rounded-full bg-border sm:hidden" aria-hidden />
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-4 sm:px-6 sm:pt-6">
          <div className="flex min-w-0 gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileCheck2 className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <h2 id="proof-review-title" className="text-lg font-bold text-foreground">
                Revisar comprobante
              </h2>
              <p className="mt-1 text-sm leading-5 text-muted-foreground">
                Confirma que el monto y el movimiento coincidan antes de preparar el pedido.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-muted-foreground disabled:opacity-50"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between rounded-xl bg-border-soft/50 px-4 py-3 text-sm">
            <span className="text-muted-foreground">Monto reportado</span>
            <strong className="tabular-nums text-foreground">
              ${Number(proof.amount_claimed ?? orderTotal).toFixed(2)}
            </strong>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background">
            {proof.signed_url && isImage ? (
              <img
                src={proof.signed_url}
                alt="Comprobante de transferencia enviado por el cliente"
                className="max-h-[48dvh] w-full object-contain"
              />
            ) : proof.signed_url ? (
              <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-6 text-center">
                <FileCheck2 className="h-9 w-9 text-blue-600" aria-hidden />
                <p className="text-sm text-muted-foreground">El comprobante es un archivo PDF.</p>
                <a
                  href={proof.signed_url}
                  target="_blank"
                  rel="noreferrer"
                  className={`${btnSecondary} rounded-xl`}
                >
                  <ExternalLink className="h-4 w-4" aria-hidden />
                  Abrir comprobante
                </a>
              </div>
            ) : (
              <p className="p-6 text-center text-sm text-muted-foreground">
                El archivo no está disponible. Actualiza la orden e inténtalo de nuevo.
              </p>
            )}
          </div>

          {decision === "reject" ? (
            <label className="mt-4 block">
              <span className="text-sm font-semibold text-foreground">Motivo del rechazo</span>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
                rows={3}
                maxLength={300}
                placeholder="Ej. El monto no coincide o la imagen no es legible."
                className="mt-2 w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:opacity-60"
              />
            </label>
          ) : null}
        </div>

        <footer className="grid shrink-0 gap-2 border-t border-border bg-surface px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 sm:grid-cols-2 sm:px-6">
          {decision === "reject" ? (
            <>
              <button
                type="button"
                onClick={() => setDecision(null)}
                disabled={busy}
                className={`${btnSecondary} min-h-12 w-full rounded-xl`}
              >
                <X className="h-4 w-4" aria-hidden />
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void review("reject")}
                disabled={busy || !reason.trim()}
                className={`${btnDanger} min-h-12 w-full rounded-xl bg-red-50`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
                Rechazar comprobante
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setDecision("reject")}
                disabled={busy}
                className={`${btnSecondary} min-h-12 w-full rounded-xl`}
              >
                <XCircle className="h-4 w-4" aria-hidden />
                No coincide
              </button>
              <button
                type="button"
                onClick={() => void review("approve")}
                disabled={busy}
                className={`${btnPrimary} min-h-12 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700`}
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
                Aprobar pago
              </button>
            </>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}
