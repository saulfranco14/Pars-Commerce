"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft, Banknote, ExternalLink, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { OrderProvider, useOrder } from "@/features/orders/hooks/useOrder";
import { OrderHeader } from "@/features/orders/components/OrderHeader";
import { CustomerCard } from "@/features/orders/components/CustomerCard";
import { AssignmentCard } from "@/features/orders/components/AssignmentCard";
import { OrderItemsTable } from "@/features/orders/components/OrderItemsTable";
import { OrderActionButtons } from "@/features/orders/components/OrderActionButtons";
import { ReceiptActions } from "@/features/orders/components/ReceiptActions";
import { PaymentLinkCard } from "@/features/orders/components/PaymentLinkCard";
import { ReceiptPreview } from "@/features/orders/components/ReceiptPreview";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import type { OrderLoanSummary } from "@/features/orders/interfaces/orderDetail";

function formatMXN(n: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(n);
}

function OrderLoanCard({ loan, tenantSlug }: { loan: OrderLoanSummary; tenantSlug: string }) {
  const isPaid = loan.status === "paid";
  const isActive = loan.status === "pending" || loan.status === "partial";

  return (
    <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="text-sm font-semibold text-foreground">Préstamo vinculado</span>
        </div>
        {isPaid ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <CheckCircle2 className="h-3 w-3" aria-hidden /> Pagado
          </span>
        ) : isActive ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-medium text-orange-700">
            <Clock className="h-3 w-3" aria-hidden /> Pendiente
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            <AlertTriangle className="h-3 w-3" aria-hidden /> {loan.status}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm text-foreground truncate">{loan.concept}</p>
          {!isPaid && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Pendiente: <span className="font-medium text-orange-700">{formatMXN(loan.amount_pending)}</span>
              {" "}de {formatMXN(loan.amount)}
            </p>
          )}
        </div>
        <Link
          href={`/dashboard/${tenantSlug}/prestamos/${loan.id}`}
          className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer shrink-0"
        >
          <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Ver préstamo
        </Link>
      </div>
    </div>
  );
}

function OrderDetailContent() {
  const {
    order,
    loading,
    error,
    tenantSlug,
    businessName,
    businessAddress,
    ticketOptions,
    logoUrl,
  } = useOrder();
  const loan = (order as { loan?: OrderLoanSummary | null } | null)?.loan ?? null;
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (loading) {
    return <LoadingBlock message="Cargando orden…" />;
  }

  if (error && !order) {
    return (
      <div className="text-sm text-muted-foreground p-6">
        {error}{" "}
        <Link
          href={`/dashboard/${tenantSlug}/ordenes`}
          className="inline-flex min-h-[44px] items-center gap-2 font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver a órdenes
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isPaid = order.status === "paid" || order.status === "completed";
  const showTicket =
    isPaid ||
    order.status === "pending_pickup" ||
    (order.status === "pending_payment" && !!order.payment_link);
  const printContainer =
    typeof document !== "undefined"
      ? document.getElementById("ticket-print-portal")
      : null;

  return (
    <>
      {printContainer &&
        createPortal(
          <div
            id="ticket-print"
            className="receipt-ticket-wrapper"
            aria-hidden="true"
            style={{ color: "#171717", backgroundColor: "#ffffff" }}
          >
            <ReceiptPreview
              order={order}
              businessName={businessName}
              items={order.items ?? []}
              businessAddress={businessAddress}
              ticketOptions={ticketOptions}
              logoUrl={logoUrl}
            />
          </div>,
          printContainer,
        )}

      <div className="no-print flex min-h-0 min-w-0 h-full w-full max-w-5xl mx-auto flex-1 flex-col overflow-x-hidden overflow-y-auto pb-40 lg:pb-6 sm:max-w-5xl md:pb-0">
        <div className="shrink-0">
          <OrderHeader />
        </div>
        {error && (
          <div className="mt-4 shrink-0 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-2">
          <div className="order-1 min-h-0 min-w-0 flex-1 md:order-3">
            <OrderItemsTable />
          </div>
          <div className="order-2 min-w-0 shrink-0 md:order-1">
            <AssignmentCard />
          </div>
          <div className="order-3 min-w-0 shrink-0 md:order-2">
            <CustomerCard />
          </div>
          {loan && (
            <div className="order-4 min-w-0 shrink-0 md:order-4">
              <OrderLoanCard loan={loan} tenantSlug={tenantSlug} />
            </div>
          )}
          <div className="order-5 min-w-0 shrink-0 md:order-5">
            <PaymentLinkCard />
          </div>
          {showTicket && (
            <div className="order-6 min-w-0 shrink-0 md:order-6">
              <ReceiptActions />
            </div>
          )}
        </div>
      </div>

      {mounted &&
        createPortal(
          <div
            className="no-print fixed left-0 right-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-surface px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
            style={{
              paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
            }}
          >
            <OrderActionButtons embedded fixedBar />
          </div>,
          document.body,
        )}
    </>
  );
}

export default function OrdenDetallePage() {
  return (
    <OrderProvider>
      <OrderDetailContent />
    </OrderProvider>
  );
}
