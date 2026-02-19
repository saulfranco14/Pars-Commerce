"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderProvider, useOrder } from "./hooks/useOrder";
import { OrderHeader } from "./components/OrderHeader";
import { CustomerCard } from "./components/CustomerCard";
import { AssignmentCard } from "./components/AssignmentCard";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { OrderActionButtons } from "./components/OrderActionButtons";
import { ReceiptActions } from "./components/ReceiptActions";
import { PaymentLinkCard } from "./components/PaymentLinkCard";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ReceiptPreview } from "./components/ReceiptPreview";

function OrderDetailContent() {
  const { order, loading, error, tenantSlug, businessName, businessAddress, ticketOptions, logoUrl } =
    useOrder();

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
  const showTicket = isPaid || order.status === "pending_pickup";
  const printContainer =
    typeof document !== "undefined" ? document.getElementById("ticket-print-portal") : null;

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
          printContainer
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
          <div className="order-4 min-w-0 shrink-0 md:order-4">
            <PaymentLinkCard />
          </div>
          {showTicket && (
            <div className="order-5 min-w-0 shrink-0 md:order-5">
              <ReceiptActions />
            </div>
          )}
        </div>
      </div>

      <div
        className="no-print fixed left-0 right-0 bottom-0 z-40 rounded-t-2xl border-t border-border bg-surface px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))",
        }}
      >
        <OrderActionButtons embedded fixedBar />
      </div>
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
