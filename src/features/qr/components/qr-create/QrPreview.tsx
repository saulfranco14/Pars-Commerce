"use client";

import { useRef, useState } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Check, Copy, CreditCard, Download, ExternalLink, Store } from "lucide-react";

import { buildPublicQrUrl } from "@/features/qr/helpers/buildPublicQrUrl";
import { formatCurrency } from "@/features/qr/helpers/format";
import { btnPrimary, btnSecondary } from "@/components/ui/buttonClasses";

import type { QrCode } from "@/features/qr/interfaces/qrCode";

interface QrPreviewProps {
  token: string;
  label?: string;
  size?: number;
  kind?: QrCode["kind"];
  tableCapacity?: number | null;
  presetAmount?: number | null;
  businessName?: string;
}

export function QrPreview({
  token,
  label,
  size = 220,
  kind,
  tableCapacity,
  presetAmount,
  businessName,
}: QrPreviewProps) {
  const printableRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const url = buildPublicQrUrl(token);

  const isTable = kind === "table";
  const isPayment = kind === "payment";
  const Icon = isTable ? Store : isPayment ? CreditCard : null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // ignore
    }
  }

  // Render a higher-resolution canvas off-screen for download, so the PNG is sharp at print size.
  function handleDownload() {
    const canvas = printableRef.current?.querySelector("canvas");
    if (!canvas) return;
    const fileName = label
      ? `qr-${label.toLowerCase().replace(/\s+/g, "-")}.png`
      : `qr-${token.slice(0, 8)}.png`;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Printable card: this is what the business will save / print / paste.
          A single framed card — no outer wrapper border and no inner box around
          the code (that read as "cuadro sobre cuadro"). */}
      <div
        ref={printableRef}
        className="flex w-full max-w-xs flex-col items-center gap-3 rounded-2xl border border-border bg-white p-6 text-center shadow-sm"
      >
        {businessName && (
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {businessName}
          </p>
        )}

        {Icon && label && (
          <div className="flex items-center gap-2 text-slate-900">
            <Icon className="h-4 w-4" />
            <h3 className="text-base font-bold">{label}</h3>
          </div>
        )}
        {!Icon && label && (
          <h3 className="text-base font-bold text-slate-900">{label}</h3>
        )}

        {isTable && tableCapacity ? (
          <p className="text-xs text-slate-500">{tableCapacity} personas</p>
        ) : null}
        {isPayment && presetAmount != null ? (
          <p className="text-xs text-slate-500">
            Monto sugerido: {formatCurrency(Number(presetAmount))}
          </p>
        ) : null}

        <div className="p-1">
          <QRCodeCanvas
            value={url}
            size={size}
            level="M"
            marginSize={1}
            bgColor="#ffffff"
            fgColor="#111111"
          />
        </div>

        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
          {isTable
            ? "Escanea para ordenar"
            : isPayment
              ? "Escanea para pagar"
              : "Escanea con tu celular"}
        </p>
      </div>

      <div className="w-full space-y-2">
        <p className="text-xs font-medium text-muted-foreground">URL pública</p>
        <div className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-border-soft/30 px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-foreground">
            {url}
          </span>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleCopy}
          className={`${btnSecondary} min-w-0 px-3`}
          aria-live="polite"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4 text-accent" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copiar URL
            </>
          )}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnSecondary} min-w-0 px-3`}
        >
          <ExternalLink className="h-4 w-4" />
          Probar
        </a>
        <button
          type="button"
          onClick={handleDownload}
          className={`${btnPrimary} col-span-2 px-3 sm:col-span-1`}
        >
          <Download className="h-4 w-4" />
          Descargar PNG
        </button>
      </div>
    </div>
  );
}
