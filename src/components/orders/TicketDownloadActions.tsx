"use client";

import { useState, useRef, useEffect } from "react";
import { Printer, Download } from "lucide-react";
import { exportReceiptAsPng } from "@/lib/receiptExport";
import { getById } from "@/services/ordersService";
import { ReceiptPreview } from "@/app/dashboard/[tenantSlug]/ordenes/[orderId]/components/ReceiptPreview";
import type { OrderDetail } from "@/app/dashboard/[tenantSlug]/ordenes/[orderId]/types";
import type { TenantAddress } from "@/types/database";

interface TicketDownloadActionsProps {
  orderId: string;
  businessName: string;
  businessAddress: TenantAddress | null;
  variant?: "compact" | "full";
}

export function TicketDownloadActions({
  orderId,
  businessName,
  businessAddress,
  variant = "compact",
}: TicketDownloadActionsProps) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportMode, setExportMode] = useState<"download" | "print" | null>(
    null,
  );
  const previewRef = useRef<HTMLDivElement>(null);

  const fetchOrder = async (): Promise<OrderDetail | null> => {
    if (order) return order;
    setLoading(true);
    setError(null);
    try {
      const data = await getById(orderId);
      const ord = data as OrderDetail;
      setOrder(ord);
      return ord;
    } catch (err) {
      setError("No se pudo cargar la orden");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ord = order ?? (await fetchOrder());
    if (!ord) return;
    setOrder(ord);
    setExportMode("download");
    setLoading(true);
  };

  const handlePrint = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ord = order ?? (await fetchOrder());
    if (!ord) return;
    setOrder(ord);
    setExportMode("print");
    setLoading(true);
  };

  useEffect(() => {
    if (!loading || !exportMode || !order) return;

    const timer = setTimeout(() => {
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
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [loading, exportMode, order, orderId]);

  const isCompact = variant === "compact";
  const btnClass =
    "inline-flex min-h-[44px] min-w-[44px] cursor-pointer items-center justify-center rounded-xl border border-border bg-surface px-2 py-2 text-foreground transition-colors duration-200 hover:bg-border-soft/80 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50";

  const btnClassFull =
    "inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-border-soft/80 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div
      className="flex items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      role="group"
      aria-label="Descargar o imprimir ticket"
    >
      {order && (exportMode === "download" || exportMode === "print") && (
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
        onClick={handleDownload}
        disabled={loading}
        className={isCompact ? btnClass : btnClassFull}
        aria-label="Descargar ticket"
      >
        <Download className="h-4 w-4 shrink-0" />
        {!isCompact && (
          <span>
            {loading && exportMode === "download" ? "Generando…" : "Descargar"}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={handlePrint}
        disabled={loading}
        className={isCompact ? btnClass : btnClassFull}
        aria-label="Imprimir ticket"
      >
        <Printer className="h-4 w-4 shrink-0" />
        {!isCompact && <span>Imprimir</span>}
      </button>
    </div>
  );
}
