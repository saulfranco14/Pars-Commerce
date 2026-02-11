"use client";

import { OrderProvider, useOrder } from "./hooks/useOrder";
import { OrderHeader } from "./components/OrderHeader";
import { CustomerCard } from "./components/CustomerCard";
import { AssignmentCard } from "./components/AssignmentCard";
import { OrderItemsTable } from "./components/OrderItemsTable";
import { ReceiptActions } from "./components/ReceiptActions";
import { OrderActionButtons } from "./components/OrderActionButtons";
import { PaymentLinkCard } from "./components/PaymentLinkCard";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { ReceiptPreview } from "./components/ReceiptPreview";

function OrderDetailContent() {
  const { order, loading, error, tenantSlug, businessName } = useOrder();

  if (loading) {
    return <LoadingBlock message="Cargando orden…" />;
  }

  if (error && !order) {
    return (
      <div className="text-sm text-muted-foreground p-6">
        {error}{" "}
        <a href={`/dashboard/${tenantSlug}/ordenes`} className="underline">
          Volver a órdenes
        </a>
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
        />
      </div>

      <div className="no-print mx-auto max-w-4xl space-y-6 px-2 sm:px-0 py-6">
        <OrderHeader />

        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* El control de la orden (Asignación) ahora es prioritario y está arriba */}
          <AssignmentCard />

          <CustomerCard />
          <OrderItemsTable />
          <PaymentLinkCard />
          {isPaid && <ReceiptActions />}

          {/* Botones de cambio de estado al final como confirmación de flujo */}
          <div className="pt-2">
            <OrderActionButtons />
          </div>
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
