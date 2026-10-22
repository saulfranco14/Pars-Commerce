"use client";

import { Check, ExternalLink, FileText, Loader2, X } from "lucide-react";

import { btnWorkDanger, btnWorkSuccess } from "@/components/ui/buttonClasses";

import { formatCurrency } from "@/features/qr/helpers/format";

import type { TransferProofRowProps } from "@/features/operaciones/interfaces/boardComponents";

const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" });

/** A transfer receipt checked right in Caja: see it, compare with the bank, decide. */
export function TransferProofRow({ proof, fallbackAmount, busy, onApprove, onReject }: TransferProofRowProps) {
  const isImage = proof.fileType.startsWith("image/");
  const amount = proof.amountClaimed ?? fallbackAmount;
  return (
    <div className="rounded-xl border border-border bg-surface p-3 shadow-sm">
      <div className="flex items-start gap-3">
        <a
          href={proof.url ?? undefined}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Ver el comprobante completo"
          className="flex h-20 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-border-soft/50"
        >
          {isImage && proof.url ? (
            // eslint-disable-next-line @next/next/no-img-element -- short-lived signed link, not an optimizable asset
            <img src={proof.url} alt="" className="h-full w-full object-cover" />
          ) : (
            <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
        </a>
        <div className="min-w-0 flex-1">
          {amount !== null && <p className="text-lg font-bold tabular-nums text-foreground">{formatCurrency(amount)}</p>}
          <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            Transferencia · por confirmar
          </span>
          <p className="mt-1 text-xs text-muted-foreground">Enviado a las {timeOf(proof.createdAt)}</p>
          {proof.url && (
            <a
              href={proof.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-accent"
            >
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Ver comprobante
            </a>
          )}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-2">
        <button type="button" disabled={busy} onClick={onApprove} className={btnWorkSuccess}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Check className="h-4 w-4" aria-hidden />}
          Recibí el dinero
        </button>
        <button type="button" disabled={busy} onClick={onReject} className={btnWorkDanger}>
          <X className="h-4 w-4" aria-hidden />
          No llegó
        </button>
      </div>
    </div>
  );
}
