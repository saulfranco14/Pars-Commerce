"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, Loader2, ReceiptText } from "lucide-react";

import { PAYMENT_METHOD_META } from "@/features/qr/constants/paymentMethodMeta";
import { formatCurrency } from "@/features/qr/helpers/format";
import { exportReceiptAsPng } from "@/lib/receiptExport";
import { ReceiptPreview } from "@/features/orders/components/receipt/ReceiptPreview";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";
import type { OrderDetail, OrderItem } from "@/features/orders/interfaces/orderDetail";

interface OrderReceiptCardProps {
  businessName: string;
  orderId: string;
  orderNumber: string | null;
  amount: number;
  paidAt: string;
  paymentMethod: string | null;
  items: Array<{
    id: string;
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
  }>;
  logoUrl?: string | null;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** A compact, exportable receipt that remains inside the QR journey. */
export function OrderReceiptCard({
  businessName,
  orderId,
  orderNumber,
  amount,
  paidAt,
  paymentMethod,
  items,
  logoUrl = null,
}: OrderReceiptCardProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const method =
    PAYMENT_METHOD_META[(paymentMethod as CustomerPayMethod) ?? "efectivo"] ??
    PAYMENT_METHOD_META.efectivo;
  const MethodIcon = method.icon;
  const receiptOrder: OrderDetail = {
    id: orderId,
    order_number: orderNumber,
    status: "paid",
    fulfillment_status: null,
    customer_id: null,
    customer_name: null,
    customer_email: null,
    customer_phone: null,
    subtotal: amount,
    discount: 0,
    total: amount,
    created_at: paidAt,
    paid_at: paidAt,
    assigned_to: null,
    payment_method: paymentMethod,
    items: [],
  };
  const receiptItems: OrderItem[] = items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    subtotal: item.subtotal,
    product: {
      id: item.product_id,
      name: item.product_name,
      type: "product",
    },
  }));

  async function downloadReceipt() {
    if (!receiptRef.current || downloading) return;
    setDownloading(true);
    setDownloadError(null);
    try {
      await exportReceiptAsPng(receiptRef.current, orderNumber ?? orderId);
    } catch {
      setDownloadError("No pudimos descargarlo. Inténtalo de nuevo.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <section
      aria-labelledby="receipt-title"
      className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
    >
      <div
        ref={receiptRef}
        className="pointer-events-none fixed left-[-9999px] top-0 w-100 bg-white p-6"
        aria-hidden
      >
        <ReceiptPreview
          order={receiptOrder}
          businessName={businessName}
          items={receiptItems}
          logoUrl={logoUrl}
        />
      </div>
      <div className="flex items-start gap-3 p-4">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
          <ReceiptText className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Comprobante digital
              </p>
              <h2 id="receipt-title" className="mt-0.5 text-base font-bold text-foreground">
                {businessName}
              </h2>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              Pagado
            </span>
          </div>
          <p className="mt-1 font-mono text-xs font-bold tracking-wider text-foreground">
            {orderNumber ?? `Pedido ${orderId.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 border-y border-border-soft/60 text-sm">
        <div className="border-r border-border-soft/60 px-4 py-3">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Total pagado
          </dt>
          <dd className="mt-1 text-lg font-bold tracking-tight text-foreground">
            {formatCurrency(amount)}
          </dd>
        </div>
        <div className="px-4 py-3">
          <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Método
          </dt>
          <dd className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
            <MethodIcon className="h-4 w-4 text-muted-foreground" aria-hidden />
            {method.label}
          </dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-3 px-4 py-3 text-xs text-muted-foreground">
        <span>{items.length} artículo{items.length === 1 ? "" : "s"}</span>
        <span>{formatDate(paidAt)}</span>
      </div>

      <div className="border-t border-border-soft/60 p-3">
        <button
          type="button"
          onClick={() => void downloadReceipt()}
          disabled={downloading}
          className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm font-bold text-foreground transition-colors hover:bg-border-soft/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Download className="h-4 w-4" aria-hidden />
          )}
          {downloading ? "Preparando comprobante..." : "Descargar comprobante"}
        </button>
        {downloadError && (
          <p className="mt-2 text-center text-xs font-semibold text-red-700" role="alert">
            {downloadError}
          </p>
        )}
      </div>
    </section>
  );
}
