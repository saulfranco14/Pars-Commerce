"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OrderProvider, useOrder } from "./hooks/useOrder";
import { OrderHeader } from "./components/OrderHeader";
import { CustomerCard } from "./components/CustomerCard";
import { AssignmentCard } from "./components/AssignmentCard";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { ReceiptActions } from "./components/ReceiptActions";
import { PaymentLinkCard } from "./components/PaymentLinkCard";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ReceiptPreview } from "./components/ReceiptPreview";

function OrderDetailContent() {
  const { order, loading, error, tenantSlug, businessName, businessAddress } =
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
          className="inline-flex items-center gap-2 font-medium text-accent underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 rounded"
        >
          <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
          Volver a órdenes
        </Link>
      </div>
    );
  }

  if (!order) return null;

  const isPaid = order.status === "paid" || order.status === "completed";

  return (
    <>
      {/* Contenedor específico para impresión física - Visible solo al imprimir */}
      <div id="ticket-print" className="hidden" aria-hidden="true">
        <ReceiptPreview
          order={order}
          businessName={businessName}
          items={order.items ?? []}
          businessAddress={businessAddress}
        />
      </div>

      <div className="no-print flex min-h-0 min-w-0 w-full max-w-5xl mx-auto flex-1 flex-col overflow-x-hidden overflow-y-auto pb-6 sm:max-w-5xl">
        <div className="shrink-0">
          <OrderHeader />
        </div>
        {error && (
          <div className="mt-4 shrink-0 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="mt-4 flex min-h-0 min-w-0 flex-1 flex-col gap-4">
          <div className="min-w-0 shrink-0">
            <AssignmentCard />
          </div>
          <div className="min-w-0 shrink-0">
            <CustomerCard />
          </div>
          <div className="min-h-0 min-w-0 flex-1">
            <OrderItemsTable />
          </div>
          <div className="min-w-0 shrink-0">
            <PaymentLinkCard />
          </div>
          {isPaid && (
            <div className="min-w-0 shrink-0">
              <ReceiptActions />
            </div>
          )}
        </div>
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
