"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Download, Copy, Check } from "lucide-react";
import { toPng } from "html-to-image";
import { useOrder } from "../hooks/useOrder";
import { ReceiptPreview } from "./ReceiptPreview";

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return await res.blob();
}

export function ReceiptActions() {
  const { order, businessName, businessAddress, setError } = useOrder();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportMode, setExportMode] = useState<"download" | "copy" | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading || !previewRef.current || !order || !exportMode) return;

    const timer = setTimeout(() => {
      const el = previewRef.current;
      if (!el) return;

      toPng(el, {
        backgroundColor: "#ffffff",
        pixelRatio: 3,
        cacheBust: true,
        style: { visibility: "visible", opacity: "1" },
      })
        .then(async (dataUrl) => {
          if (!dataUrl || dataUrl.length < 500) throw new Error("Imagen inválida");

          const blob = await dataUrlToBlob(dataUrl);
          const fileName = `recibo-${order.id.slice(0, 8)}.png`;

          if (exportMode === "download") {
            const a = document.createElement("a");
            a.href = dataUrl;
            a.download = fileName;
            a.click();
          } else if (exportMode === "copy") {
            try {
              const item = new ClipboardItem({ "image/png": blob });
              await navigator.clipboard.write([item]);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch (err) {
              console.error(err);
              // Fallback download
              const a = document.createElement("a");
              a.href = dataUrl;
              a.download = fileName;
              a.click();
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
        />
      </div>

      <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex min-h-[44px] w-full items-center justify-between gap-2 px-4 py-3 text-left sm:px-5"
        >
          <div className="text-left">
            <h2 className="text-sm font-semibold text-foreground">
              Recibo y ticket
            </h2>
            <p className="mt-0.5 text-xs text-muted">
              Descarga, copia o imprime el recibo de la orden.
            </p>
          </div>
          <span
            className={`shrink-0 text-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            ▼
          </span>
        </button>
        {open && (
          <div className="border-t border-border px-4 pb-4 pt-3 sm:px-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
