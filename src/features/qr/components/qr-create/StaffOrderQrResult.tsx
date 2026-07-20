"use client";

import { CheckCircle2, MessageCircle, Plus } from "lucide-react";

import { QrPreview } from "@/features/qr/components/qr-create/QrPreview";
import { buildPublicQrUrl } from "@/features/qr/helpers/buildPublicQrUrl";
import { formatCurrency } from "@/features/qr/helpers/format";

interface StaffOrderQrResultProps {
  total: number;
  /** Present in counter mode; null when the order was appended to a table. */
  qrToken: string | null;
  customerName?: string;
  businessName?: string;
  onNewOrder: () => void;
}

/**
 * Confirmation after staff creates an order. Follows the admin card language
 * (DESIGN_SYSTEM.md §4.7): one summary card with the amount as protagonist,
 * the QR beneath, and stacked full-width actions — mobile-first, no banners
 * bolted on. Reuses QrPreview (print/download/copy) as the QR block.
 */
export function StaffOrderQrResult({
  total,
  qrToken,
  customerName,
  businessName,
  onNewOrder,
}: StaffOrderQrResultProps) {
  const url = qrToken ? buildPublicQrUrl(qrToken) : null;
  const waHref = url
    ? `https://wa.me/?text=${encodeURIComponent(
        `Tu pedido en ${businessName ?? "el negocio"} · Total ${formatCurrency(total)}. Págalo aquí: ${url}`,
      )}`
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {/* Summary card — amount protagonist */}
      <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-foreground">
              Pedido creado
            </h2>
            <p className="truncate text-xs text-muted-foreground">
              {customerName
                ? `${customerName} · escanea el código para pagar`
                : qrToken
                  ? "El cliente escanea el código para revisar y pagar"
                  : "Se agregó a la cuenta de la mesa"}
            </p>
          </div>
          <p className="shrink-0 text-2xl font-bold tracking-tight text-foreground">
            {formatCurrency(total)}
          </p>
        </div>
      </section>

      {qrToken ? (
        <>
          {/* QR block (print / download / copy live inside QrPreview) */}
          <QrPreview
            token={qrToken}
            kind="order"
            label={customerName || "Pedido"}
            businessName={businessName}
          />

          {/* Actions — stacked, full width, thumb-reachable */}
          <div className="space-y-2">
            {waHref && (
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-bold text-white shadow-sm shadow-emerald-600/20 transition-colors hover:bg-emerald-700"
              >
                <MessageCircle className="h-4 w-4" />
                Enviar por WhatsApp
              </a>
            )}
            <button
              type="button"
              onClick={onNewOrder}
              className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40"
            >
              <Plus className="h-4 w-4" />
              Nuevo pedido
            </button>
          </div>
        </>
      ) : (
        <button
          type="button"
          onClick={onNewOrder}
          className="inline-flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40"
        >
          <Plus className="h-4 w-4" />
          Nuevo pedido
        </button>
      )}
    </div>
  );
}
