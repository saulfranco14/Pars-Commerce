"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Archive,
  Check,
  Copy,
  Coffee,
  CreditCard,
  ExternalLink,
  Eye,
  Power,
} from "lucide-react";

import { buildPublicQrUrl } from "@/features/qr/helpers/buildPublicQrUrl";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

type PendingAction = "toggle" | "archive" | null;

interface QRCodeCardProps {
  tenantSlug: string;
  code: QrCode;
  busy?: boolean;
  onPreview?: (code: QrCode) => void;
  onToggleActive?: (code: QrCode) => void;
  onArchive?: (code: QrCode) => void;
}

export function QRCodeCard({
  tenantSlug,
  code,
  busy = false,
  onPreview,
  onToggleActive,
  onArchive,
}: QRCodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [pending, setPending] = useState<PendingAction>(null);
  const url = buildPublicQrUrl(code.token);
  const isTable = code.kind === "table";
  const Icon = isTable ? Coffee : CreditCard;
  const isInactive = !code.is_active;

  async function handleCopy(e: React.MouseEvent) {
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  function requestToggle() {
    if (!onToggleActive || busy) return;
    // If activating, no confirmation needed; if deactivating, confirm first.
    if (isInactive) {
      onToggleActive(code);
      return;
    }
    setPending("toggle");
  }

  function requestArchive() {
    if (!onArchive || busy) return;
    setPending("archive");
  }

  async function handleConfirm() {
    if (pending === "toggle" && onToggleActive) await onToggleActive(code);
    if (pending === "archive" && onArchive) await onArchive(code);
    setPending(null);
  }

  return (
    <article
      className={`flex flex-col gap-4 rounded-xl border bg-surface p-4 transition-colors ${
        isInactive
          ? "border-border opacity-70 hover:border-border"
          : "border-border hover:border-accent/40"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* QR thumb */}
        <button
          type="button"
          onClick={() => onPreview?.(code)}
          aria-label="Ver QR ampliado"
          className={`flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-border bg-white p-2 transition-transform hover:scale-105 ${isInactive ? "grayscale" : ""}`}
        >
          <QRCodeCanvas
            value={url}
            size={64}
            level="M"
            marginSize={0}
            bgColor="#ffffff"
            fgColor="#111111"
          />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="h-3.5 w-3.5" />
            <span>{isTable ? "Mesa" : "Cobro libre"}</span>
            <span aria-hidden>·</span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                code.is_active
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  code.is_active ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              {code.is_active ? "Activo" : "Inactivo"}
            </span>
          </div>
          <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">
            {code.label}
          </h3>
          {isTable && code.table_capacity ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {code.table_capacity} personas
            </p>
          ) : null}
          {!isTable && code.preset_amount != null ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Monto sugerido: $
              {Number(code.preset_amount).toLocaleString("es-MX", {
                minimumFractionDigits: 2,
              })}
            </p>
          ) : null}
        </div>
      </div>

      {isInactive && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Este QR no funcionará al escanearlo. Actívalo para volver a usarlo.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border-soft/40"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-accent" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copiar
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-border-soft/40"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Probar
        </a>
        {onToggleActive && (
          <button
            type="button"
            onClick={requestToggle}
            disabled={busy}
            className={`inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-border-soft/40 disabled:cursor-not-allowed disabled:opacity-60 ${
              isInactive
                ? "border-emerald-200 text-emerald-700"
                : "border-amber-200 text-amber-800"
            }`}
          >
            <Power className="h-3.5 w-3.5" />
            {busy ? "..." : isInactive ? "Activar" : "Desactivar"}
          </button>
        )}
        {onArchive && (
          <button
            type="button"
            onClick={requestArchive}
            disabled={busy}
            aria-label="Archivar"
            className="inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-lg border border-red-200 bg-surface px-2.5 py-1.5 text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Archive className="h-3.5 w-3.5" />
          </button>
        )}
        <Link
          href={`/dashboard/${tenantSlug}/qr/${code.id}`}
          className="ml-auto inline-flex min-h-[36px] cursor-pointer items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground hover:bg-accent/90"
        >
          <Eye className="h-3.5 w-3.5" />
          Detalle
        </Link>
      </div>

      <ConfirmDialog
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        onConfirm={handleConfirm}
        title={
          pending === "toggle"
            ? "Desactivar este código QR"
            : "Archivar este código QR"
        }
        description={
          pending === "toggle"
            ? "Al desactivarlo dejará de funcionar para los clientes que lo escaneen. Puedes reactivarlo en cualquier momento."
            : "Se quitará del listado activo. Esta acción no se puede deshacer fácilmente."
        }
        confirmLabel={pending === "toggle" ? "Desactivar" : "Archivar"}
        variant="danger"
        loading={busy}
      />
    </article>
  );
}
