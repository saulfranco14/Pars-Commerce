"use client";

import Link from "next/link";
import { useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Archive,
  Check,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  Power,
  Store,
} from "lucide-react";

import { AdminListCard } from "@/components/admin/AdminListCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminActionButtonPrimary, adminActionButtonSecondary } from "@/components/admin/actionButtonClasses";
import { ActionsMenu } from "@/components/ui/ActionsMenu";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { buildPublicQrUrl } from "@/features/qr/helpers/buildPublicQrUrl";
import { formatCurrency } from "@/features/qr/helpers/format";

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

/**
 * Mobile-first: 2 primary actions visible (Copiar, Detalle) + an overflow
 * menu (Probar, Activar/Desactivar, Archivar) instead of 5 competing
 * buttons — see DESIGN_SYSTEM.md card action guidance.
 */
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
  const Icon = isTable ? Store : CreditCard;
  const isInactive = !code.is_active;

  async function handleCopy() {
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

  const thumbnail = (
    <button
      type="button"
      onClick={() => onPreview?.(code)}
      aria-label="Ver QR ampliado"
      className={`flex h-20 w-20 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-border bg-white p-2 transition-transform hover:scale-105 ${
        isInactive ? "grayscale" : ""
      }`}
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
  );

  const meta = (
    <div className="flex flex-wrap items-center gap-1.5">
      <Icon className="h-3.5 w-3.5" />
      <span>{isTable ? "Mesa" : "Cobro libre"}</span>
      {isTable && code.table_capacity ? (
        <>
          <span aria-hidden>·</span>
          <span>{code.table_capacity} personas</span>
        </>
      ) : null}
      {!isTable && code.preset_amount != null ? (
        <>
          <span aria-hidden>·</span>
          <span>Sugerido: {formatCurrency(Number(code.preset_amount))}</span>
        </>
      ) : null}
    </div>
  );

  const menuItems = [
    {
      label: "Probar QR",
      icon: ExternalLink,
      onClick: () => window.open(url, "_blank", "noopener,noreferrer"),
    },
    ...(onToggleActive
      ? [
          {
            label: isInactive ? "Activar" : "Desactivar",
            icon: Power,
            onClick: requestToggle,
            disabled: busy,
          },
        ]
      : []),
    ...(onArchive
      ? [
          {
            label: "Archivar",
            icon: Archive,
            onClick: requestArchive,
            disabled: busy,
            danger: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <AdminListCard
        title={code.label}
        thumbnail={thumbnail}
        meta={meta}
        badge={
          <StatusBadge
            tone={code.is_active ? "success" : "warning"}
            label={code.is_active ? "Activo" : "Inactivo"}
          />
        }
        body={
          isInactive ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Este QR no funcionará al escanearlo. Actívalo para volver a
              usarlo.
            </p>
          ) : undefined
        }
        actions={
          <div className="flex w-full items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className={`flex-1 ${adminActionButtonSecondary} min-h-11`}
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
            <Link
              href={`/dashboard/${tenantSlug}/qr/${code.id}`}
              className={`flex-1 ${adminActionButtonPrimary} min-h-11`}
            >
              <Eye className="h-3.5 w-3.5" />
              Detalle
            </Link>
            <ActionsMenu items={menuItems} aria-label={`Más acciones para ${code.label}`} />
          </div>
        }
      />

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
    </>
  );
}
