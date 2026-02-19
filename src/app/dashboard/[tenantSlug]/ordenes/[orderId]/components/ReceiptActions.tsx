"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Download, Copy, Check, ChevronDown, Share2 } from "lucide-react";
import { captureReceiptAsPng, downloadReceiptBlob } from "@/lib/receiptExport";
import { useOrder } from "../hooks/useOrder";
import { ReceiptPreview } from "./ReceiptPreview";

export function ReceiptActions() {
  const { order, businessName, businessAddress, ticketOptions, logoUrl, setError } = useOrder();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState<"download" | "copy" | "share" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading || !previewRef.current || !order || !exportMode) return;

    const timer = setTimeout(() => {
      const el = previewRef.current;
      if (!el) return;

      captureReceiptAsPng(el)
        .then(async (blob) => {
          if (exportMode === "download") {
            downloadReceiptBlob(blob, order.id);
          } else if (exportMode === "copy") {
            try {
              const item = new ClipboardItem({ "image/png": blob });
              await navigator.clipboard.write([item]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch (err) {
              console.error(err);
              downloadReceiptBlob(blob, order.id);
            }
          } else if (exportMode === "share") {
            try {
              const file = new File([blob], `recibo-${order.id}.png`, { type: "image/png" });
              if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ title: `Recibo ${order.id}`, files: [file] });
              } else {
                downloadReceiptBlob(blob, order.id);
              }
            } catch (err) {
              if ((err as Error).name !== "AbortError") {
                downloadReceiptBlob(blob, order.id);
              }
            }
          }
        })
        .catch((err) => {
          console.error(err);
          setError("No se pudo procesar la imagen.");
        })
        .finally(() => {
          setLoading(false);
          setExportMode(null);
        });
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, order, exportMode, setError]);

  if (!order) return null;

  return (
    <>
      {/* Hidden element for capture */}
      <div
        ref={previewRef}
        className={`w-[400px] bg-white p-6 ${
          loading
            ? "fixed left-0 top-0 z-[-9999] opacity-100"
            : "absolute left-[-9999px] top-[-9999px] opacity-0 pointer-events-none"
        }`}
        style={{ color: "#171717", backgroundColor: "#ffffff" }}
        aria-hidden
      >
        <ReceiptPreview
          order={order}
          businessName={businessName}
          items={order.items ?? []}
          businessAddress={businessAddress}
          ticketOptions={ticketOptions}
          logoUrl={logoUrl}
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-raised shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-2 text-left sm:px-5 sm:py-3"
        >
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">
              Recibo y ticket
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Descarga, copia o imprime el recibo de la orden.
            </p>
          </div>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            aria-hidden
          />
        </button>
        {open && (
          <div className="border-t border-border/50 px-4 pb-4 pt-3 sm:px-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => {
                  setExportMode("share");
                  setLoading(true);
                }}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft/80 disabled:opacity-50 transition-colors"
              >
                <Share2 className="h-4 w-4" />
                {loading && exportMode === "share" ? "Preparando…" : "Compartir"}
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft/80 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportMode("download");
                  setLoading(true);
                }}
                disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft/80 disabled:opacity-50 transition-colors"
              >
                <Download className="h-4 w-4" />
                {loading && exportMode === "download" ? "Generando..." : "Descargar"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setExportMode("copy");
                  setLoading(true);
                }}
                disabled={loading}
                className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition-all ${
                  copied ? "text-green-600 border-green-200 bg-green-50" : "text-foreground hover:bg-border-soft/80"
                } disabled:opacity-50`}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "¡Copiado!" : "Copiar imagen"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
