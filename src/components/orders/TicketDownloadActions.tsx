"use client";

import { useState, useRef, useEffect } from "react";
import useSWR from "swr";
import { Printer, Download, Share2 } from "lucide-react";
import { exportReceiptAsPng } from "@/lib/receiptExport";
import { ReceiptPreview } from "@/app/dashboard/[tenantSlug]/ordenes/[orderId]/components/ReceiptPreview";
import type { OrderDetail } from "@/app/dashboard/[tenantSlug]/ordenes/[orderId]/types";
import type { TenantAddress } from "@/types/database";
import type { TicketSettings } from "@/types/ticketSettings";
import { mergeTicketSettings } from "@/types/ticketSettings";
import { swrFetcher } from "@/lib/swrFetcher";
import { captureReceiptAsPng } from "@/lib/receiptExport";

interface TicketDownloadActionsProps {
  orderId: string;
  businessName: string;
  businessAddress: TenantAddress | null;
  ticketOptions?: TicketSettings | null;
  logoUrl?: string | null;
  variant?: "compact" | "full";
}

const orderKey = (id: string) =>
  `/api/orders?order_id=${encodeURIComponent(id)}`;

export function TicketDownloadActions({
  orderId,
  businessName,
  businessAddress,
  ticketOptions: ticketOptionsProp,
  logoUrl,
  variant = "compact",
}: TicketDownloadActionsProps) {
  const ticketOptions = mergeTicketSettings(ticketOptionsProp);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<
    "download" | "print" | "share" | null
  >(null);
  const [shouldFetch, setShouldFetch] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchKey = shouldFetch && orderId ? orderKey(orderId) : null;
  const { data: orderData, error: swrError, isLoading: swrLoading } = useSWR<
    OrderDetail | null
  >(fetchKey, swrFetcher);
  const order = orderData ?? null;

  useEffect(() => {
    if (swrError) setError("No se pudo cargar la orden");
  }, [swrError]);

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShouldFetch(true);
    setExportMode("download");
    setLoading(true);
  };

  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShouldFetch(true);
    setExportMode("print");
    setLoading(true);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShouldFetch(true);
    setExportMode("share");
    setLoading(true);
  };

  useEffect(() => {
    if (!loading || !exportMode || !order) return;

    const timer = setTimeout(async () => {
      const el = previewRef.current;
      if (!el) {
        setLoading(false);
        setExportMode(null);
        return;
      }

      if (exportMode === "download") {
        exportReceiptAsPng(el, orderId)
          .catch(() => setError("No se pudo generar la imagen"))
          .finally(() => {
            setLoading(false);
            setExportMode(null);
          });
      } else if (exportMode === "print") {
        window.print();
        setLoading(false);
        setExportMode(null);
      } else if (exportMode === "share") {
        try {
          const blob = await captureReceiptAsPng(el);
          const file = new File(
            [blob],
            `recibo-${orderId}.png`,
            { type: "image/png" }
          );
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `Recibo ${orderId}`,
              files: [file],
            });
          } else {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `recibo-${orderId}.png`;
            link.click();
            URL.revokeObjectURL(url);
          }
        } catch (err) {
          if ((err as Error).name !== "AbortError") {
            setError("No se pudo compartir");
          }
        } finally {
          setLoading(false);
          setExportMode(null);
        }
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, exportMode, order, orderId]);

  const isCompact = variant === "compact";
  const btnClass =
    "inline-flex min-h-(--touch-target,44px) min-w-(--touch-target,44px) cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-2 py-2 text-foreground transition-colors duration-200 hover:bg-border-soft/80 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50";

  const btnClassFull =
    "inline-flex min-h-(--touch-target,44px) cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/80 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Compartir, descargar o imprimir ticket"
    >
      {order &&
        (exportMode === "download" ||
          exportMode === "print" ||
          exportMode === "share") && (
        <div
          ref={previewRef}
          id={exportMode === "print" ? "ticket-print" : undefined}
          className={
            loading
              ? "fixed left-0 top-0 z-[-9999] w-[400px] bg-white p-6 opacity-100"
              : "absolute -left-[9999px] -top-[9999px] w-[400px] bg-white p-6 opacity-0 pointer-events-none"
          }
          style={{ color: "#171717", backgroundColor: "#ffffff" }}
          aria-hidden
        >
          <ReceiptPreview
            order={order}
            businessName={businessName}
            items={order.items ?? []}
            businessAddress={businessAddress}
            ticketOptions={ticketOptions}
            logoUrl={logoUrl ?? null}
          />
        </div>
      )}

      {error && (
        <span className="text-xs text-red-600" role="alert">
          {error}
        </span>
      )}

      <button
        type="button"
        onClick={handleShare}
        disabled={loading || (shouldFetch && swrLoading)}
        className={isCompact ? btnClass : btnClassFull}
        aria-label="Compartir ticket"
      >
        <Share2 className="h-4 w-4 shrink-0" />
        {!isCompact && (
          <span>
            {loading && exportMode === "share"
              ? "Preparando…"
              : shouldFetch && swrLoading
                ? "Cargando…"
                : "Compartir"}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={handleDownload}
        disabled={loading || (shouldFetch && swrLoading)}
        className={isCompact ? btnClass : btnClassFull}
        aria-label="Descargar ticket"
      >
        <Download className="h-4 w-4 shrink-0" />
        {!isCompact && (
          <span>
            {loading && exportMode === "download"
              ? "Generando…"
              : shouldFetch && swrLoading
                ? "Cargando…"
                : "Descargar"}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        disabled={loading || (shouldFetch && swrLoading)}
        className={isCompact ? btnClass : btnClassFull}
        aria-label="Imprimir ticket"
      >
        <Printer className="h-4 w-4 shrink-0" />
        {!isCompact && <span>Imprimir</span>}
      </button>
    </div>
  );
}
