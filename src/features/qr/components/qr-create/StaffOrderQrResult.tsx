"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight, MessageCircle, Plus } from "lucide-react";

import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";
import { buildPublicQrUrl } from "@/features/qr/helpers/buildPublicQrUrl";
import { formatCurrency } from "@/features/qr/helpers/format";

interface StaffOrderQrResultProps {
  total: number;
  /** Present in counter mode; null when the order was appended to a table. */
  qrToken: string | null;
  customerName?: string;
  businessName?: string;
  tableLabel?: string;
  returnToTableHref?: string;
  onNewOrder: () => void;
}

/** Confirmation keeps the next task explicit: send a QR in counter mode, or
 * return to the live table when staff appended a round to an existing mesa. */
export function StaffOrderQrResult({
  total,
  qrToken,
  customerName,
  businessName,
  tableLabel,
  returnToTableHref,
  onNewOrder,
}: StaffOrderQrResultProps) {
  const url = qrToken ? buildPublicQrUrl(qrToken) : null;
  const waHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        `Tu pedido en ${businessName ?? "el negocio"} · Total ${formatCurrency(total)}. Págalo aquí: ${url}`,
      )}`
    : null;
  const wasAddedToTable = !qrToken && !!returnToTableHref;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">
              {wasAddedToTable ? "Pedido agregado" : "Pedido creado"}
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {wasAddedToTable
                ? `Ya forma parte de ${tableLabel ?? "la mesa"}`
                : customerName
                  ? `${customerName} · escanea el código para pagar`
                  : "El cliente escanea el código para revisar y pagar"}
            </p>
          </div>
          <p className="shrink-0 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </p>
        </div>
      </section>

      {qrToken ? (
        <>
          <QrPreview
            token={qrToken}
            kind="order"
            label={customerName || "Pedido"}
            businessName={businessName}
          />
          <div className="space-y-2">
            {waHref && (
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700">
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </a>
            )}
            <button type="button" onClick={onNewOrder} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40">
              <Plus className="h-4 w-4" />
              Nuevo pedido
            </button>
          </div>
        </>
      ) : wasAddedToTable ? (
        <div className="space-y-2">
          <Link href={returnToTableHref} className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]">
            Ver avance de {tableLabel ?? "la mesa"}
            <ChevronRight className="h-5 w-5" />
          </Link>
          <button type="button" onClick={onNewOrder} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40">
            <Plus className="h-4 w-4" />
            Agregar otro pedido
          </button>
        </div>
      ) : (
        <button type="button" onClick={onNewOrder} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40">
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      )}
    </div>
  );
}
