"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RefreshCw, Sparkles, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { TransferProofUpload } from "./TransferProofUpload";
import { MobileActionBar } from "@/components/layout/MobileActionBar";

type TrackingOrderFooterProps = {
  total: number;
  status: string;
  token: string;
  paymentVerificationStatus?: string | null;
  paymentSettled?: boolean;
  canReview?: boolean;
  reviewTargetId?: string | null;
};

export function TrackingOrderFooter({
  total,
  status,
  token,
  paymentVerificationStatus,
  paymentSettled = false,
  canReview = false,
  reviewTargetId = null,
}: TrackingOrderFooterProps) {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [proofOpen, setProofOpen] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const canUploadProof =
    !paymentSettled &&
    (paymentVerificationStatus === "proof_required" ||
      paymentVerificationStatus === "rejected");
  const proofIsUnderReview =
    !paymentSettled && paymentVerificationStatus === "proof_submitted";

  useEffect(() => {
    if (!proofOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setProofOpen(false);
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [proofOpen]);

  function refreshStatus() {
    setRefreshing(true);
    setUpdated(false);
    router.refresh();
    window.setTimeout(() => {
      setRefreshing(false);
      setUpdated(true);
    }, 450);
  }

  function continueToReviews() {
    if (!reviewTargetId) return;
    setCelebrating(true);
    const target = document.getElementById(`review-${reviewTargetId}`);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
    window.dispatchEvent(
      new CustomEvent("tlaco:open-review", {
        detail: { itemId: reviewTargetId },
      }),
    );
    window.setTimeout(() => setCelebrating(false), 900);
  }

  const button = canReview && reviewTargetId ? (
    <button
      type="button"
      onClick={continueToReviews}
      className={`mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition hover:bg-blue-700 active:scale-[0.99] ${celebrating ? "ring-4 ring-blue-100" : ""}`}
    >
      <Sparkles
        className={`h-5 w-5 ${celebrating ? "motion-safe:animate-bounce" : ""}`}
        aria-hidden
      />
      Continuar y calificar mi pedido
    </button>
  ) : canReview ? (
    <div className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-50 px-5 text-base font-bold text-emerald-800">
      <CheckCircle2 className="h-5 w-5" aria-hidden />
      Gracias por calificar tu pedido
    </div>
  ) : canUploadProof ? (
    <button
      type="button"
      onClick={() => setProofOpen(true)}
      className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800"
    >
      <Upload className="h-5 w-5" aria-hidden />
      {paymentVerificationStatus === "rejected"
        ? "Reemplazar comprobante"
        : "Subir comprobante"}
    </button>
  ) : (
    <button
      type="button"
      onClick={refreshStatus}
      disabled={refreshing}
      className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-base font-bold text-white transition-colors hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
      {refreshing
        ? "Actualizando el pedido…"
        : proofIsUnderReview
          ? "Revisar validación del comprobante"
          : "Actualizar estado del pedido"}
    </button>
  );

  return (
    <>
    <MobileActionBar className="sm:left-1/2 sm:right-auto sm:w-[min(42rem,calc(100%-3rem))] sm:-translate-x-1/2" contentClassName="max-w-2xl">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Total del pedido</p>
            <p className="mt-0.5 text-3xl font-bold tabular-nums tracking-tight text-foreground">${total.toFixed(2)}</p>
          </div>
          <span className="mb-1 rounded-full bg-blue-50 px-2.5 py-1 text-right text-[11px] font-semibold text-blue-800">{updated ? "Actualizado ahora" : status}</span>
        </div>
        {button}
    </MobileActionBar>
    {proofOpen ? (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="proof-sheet-title">
        <button type="button" className="absolute inset-0 cursor-default" onClick={() => setProofOpen(false)} aria-label="Cerrar" />
        <div className="relative z-10 w-full rounded-t-[28px] border border-border bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-2xl sm:max-w-md sm:rounded-3xl sm:p-6">
          <div className="mx-auto h-1 w-12 rounded-full bg-slate-300 sm:hidden" aria-hidden />
          <div className="mt-3 flex items-start justify-between gap-4 sm:mt-0">
            <div>
              <h2 id="proof-sheet-title" className="text-lg font-bold text-foreground">
                {paymentVerificationStatus === "rejected" ? "Reemplazar comprobante" : "Subir comprobante"}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">El archivo será privado y sólo el negocio podrá revisarlo.</p>
            </div>
            <button type="button" onClick={() => setProofOpen(false)} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground" aria-label="Cerrar">
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <div className="mt-5">
            <TransferProofUpload
              token={token}
              total={total}
              replacement={paymentVerificationStatus === "rejected"}
              onSubmitted={() => {
                setProofOpen(false);
                router.refresh();
              }}
            />
          </div>
        </div>
      </div>
    ) : null}
    </>
  );
}
