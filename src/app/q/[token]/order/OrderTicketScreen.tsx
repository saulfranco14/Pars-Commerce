"use client";

import { useMemo, useState } from "react";
import { ChevronDown, CreditCard, RefreshCw, ShoppingBag } from "lucide-react";
import useSWR from "swr";

import { Notification } from "@/components/ui/Notification";
import { CustomerScreen } from "@/features/qr/components/customer/CustomerScreen";
import { BillScreenSkeleton } from "@/features/qr/components/bill/BillScreenSkeleton";
import { CustomerPayModal } from "@/features/qr/components/payment/CustomerPayModal";
import { PaymentReceipt } from "@/features/qr/components/payment/PaymentReceipt";
import { PickupTrackerCard } from "@/features/qr/components/order-tracker/PickupTrackerCard";
import { OrderReceiptCard } from "@/features/qr/components/order-ticket/OrderReceiptCard";
import { PostPurchaseRecommendations } from "@/features/qr/components/order-ticket/PostPurchaseRecommendations";
import { formatCurrency } from "@/features/qr/helpers/format";
import { useBillData } from "@/features/qr/hooks/useBillData";
import { usePaymentFlow } from "@/features/qr/hooks/usePaymentFlow";

import type { CustomerPayMethod } from "@/features/qr/components/payment/CustomerPayModal";
import type {
  QrSessionTenant,
  TablePulseResponse,
} from "@/features/qr/interfaces/tableSession";

interface OrderTicketScreenProps {
  token: string;
  tenant: QrSessionTenant;
  orderId: string;
  initialOrder?: {
    status: string;
    fulfillment_status?: string;
    total?: number;
  };
}

async function fetchOrderPulse([
  url,
  fingerprint,
]: readonly [string, string]): Promise<TablePulseResponse> {
  const response = await fetch(url, {
    headers: { "x-fingerprint-id": fingerprint },
  });
  if (!response.ok) throw new Error("No se pudo actualizar el pedido");
  return response.json();
}

/**
 * Lean pay screen for a single-use staff 'order' ticket: the order is ALREADY
 * built by staff, so the customer just reviews the items and pays — no name
 * prompt, no menu, no table/merge logic. Anonymous by design; a phone is only
 * requested for manual methods (handled inside the pay modal / intent).
 *
 * Reuses useBillData (items + total + payment state) and usePaymentFlow +
 * CustomerPayModal — the same payment engine as the table bill.
 */
export function OrderTicketScreen({
  token,
  tenant,
  orderId,
  initialOrder,
}: OrderTicketScreenProps) {
  const { data, isLoading, error, mutate, fingerprint } = useBillData(
    token,
    orderId,
  );

  const [refreshing, setRefreshing] = useState(false);
  const refresh = async () => {
    setRefreshing(true);
    try {
      await mutate();
    } finally {
      setTimeout(() => setRefreshing(false), 400);
    }
  };

  const paymentFlow = usePaymentFlow({
    orderId,
    qrToken: token,
    fingerprint,
    onSubmitted: refresh,
  });

  const shouldTrackPreparation =
    data?.order.status === "paid" &&
    data.order.fulfillment_status !== "ready" &&
    !!fingerprint;
  const { data: pulse } = useSWR<TablePulseResponse>(
    shouldTrackPreparation
      ? ([
          `/api/qr/table/pulse?token=${encodeURIComponent(token)}`,
          fingerprint,
        ] as const)
      : null,
    fetchOrderPulse,
    {
      refreshInterval: (latest) =>
        latest?.order?.fulfillment_status === "ready" ? 0 : 10_000,
      dedupingInterval: 10_000,
      revalidateOnFocus: false,
    },
  );

  // A pending manual payment (cash/transfer) awaiting business validation.
  const sharedPendingGroup = useMemo(() => {
    if (!data || paymentFlow.pending) return null;
    return (
      data.groups.find((g) => g.payment_status === "pending_validation") ?? null
    );
  }, [data, paymentFlow.pending]);

  if (isLoading && !data) {
    return <BillScreenSkeleton />;
  }

  if (!data && initialOrder?.status === "paid") {
    return (
      <CustomerScreen
        tone="success"
        tenantName={tenant.name}
        header={
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
              Pago confirmado
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight">
              Estamos preparando tu comprobante
            </p>
          </div>
        }
      >
        <div className="space-y-3">
          <Notification
            tone="info"
            title="Tu pago sigue registrado"
            message="No necesitas volver a pagar. Intenta recuperar tu comprobante en unos segundos."
          />
          <button
            type="button"
            onClick={() => void mutate()}
            className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-accent bg-surface px-4 text-sm font-bold text-accent transition-colors hover:bg-accent/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Recuperar comprobante
          </button>
        </div>
      </CustomerScreen>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-6">
        <Notification
          tone="error"
          title="No se pudo cargar tu pedido"
          message="Revisa tu conexión e inténtalo de nuevo en unos segundos."
        />
      </main>
    );
  }

  const isPaid = data.order.status === "paid";
  const fulfillmentStatus =
    pulse?.order?.fulfillment_status ?? data.order.fulfillment_status;

  /* ---------- Receipt after submitting a payment intent ---------- */
  if (paymentFlow.pending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6">
        <PaymentReceipt
          amount={paymentFlow.pending.amount}
          method={paymentFlow.pending.method}
          paidAt={paymentFlow.pending.submittedAt}
          businessName={tenant.name}
          status="pending_validation"
          onClose={paymentFlow.dismissPending}
          onRefresh={refresh}
          refreshing={refreshing}
          showSecondaryAction={false}
        />
      </main>
    );
  }

  /* ---------- Someone already marked payment (shared pending) ---------- */
  if (sharedPendingGroup && !isPaid) {
    const amount = Number(
      sharedPendingGroup.balance_due || sharedPendingGroup.total,
    );
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6">
        <PaymentReceipt
          amount={amount}
          method={(data.order.payment_method as CustomerPayMethod) ?? "efectivo"}
          paidAt={new Date().toISOString()}
          businessName={tenant.name}
          status="pending_validation"
          onClose={refresh}
          onRefresh={refresh}
          refreshing={refreshing}
          showSecondaryAction={false}
        />
      </main>
    );
  }

  const footer = isPaid ? null : (
    <button
      type="button"
      onClick={() =>
        paymentFlow.pickTarget({ kind: "full", amount: data.order.balance_due })
      }
      className="flex min-h-14 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
    >
      <CreditCard className="h-5 w-5" />
      Pagar {formatCurrency(data.order.balance_due)}
    </button>
  );

  return (
    <CustomerScreen
      tone={isPaid ? "success" : "accent"}
      tenantName={tenant.name}
      header={
        <div className="w-full">
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
            Tu pedido
          </p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {formatCurrency(data.order.total)}
          </p>
          {!isPaid && (
            <p className="mt-1 text-xs font-medium opacity-85">
              Revisa tu pedido y paga cuando quieras.
            </p>
          )}
        </div>
      }
      footer={footer}
    >
      <div className="space-y-3">
        {/* Pagar es el principio, no el final: aquí el cliente ve avanzar su
            pedido sin recargar, igual que en una mesa. */}
        <PickupTrackerCard
          fulfillmentStatus={fulfillmentStatus}
          orderStatus={data.order.status}
          orderNumber={data.order.order_number}
          loading={isLoading}
        />

        {isPaid && (
          <OrderReceiptCard
            businessName={data.tenant?.name ?? tenant.name}
            orderId={data.order.id}
            orderNumber={data.order.order_number}
            amount={data.order.total}
            paidAt={data.order.created_at}
            paymentMethod={data.order.payment_method}
            itemCount={data.items.length}
          />
        )}

        {isPaid && data.tenant && (
          <PostPurchaseRecommendations
            tenantId={data.tenant.id}
            tenantName={data.tenant.name}
            tenantLogoUrl={data.tenant.logo_url}
            purchasedProductIds={data.items.map((item) => item.product_id)}
          />
        )}

        <details
          className="group rounded-2xl border border-border bg-surface shadow-sm"
          open={!isPaid}
        >
          <summary className="flex min-h-12 cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">
              Detalle de compra
            </h2>
            <span className="ml-auto text-sm font-bold text-foreground">
              {formatCurrency(data.order.total)}
            </span>
            <span className="rounded-full bg-border-soft/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {data.items.length}
            </span>
            <ChevronDown
              className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180"
              aria-hidden
            />
          </summary>
          <ul className="space-y-2.5 border-t border-border-soft/50 px-4 py-3">
            {data.items.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 border-b border-border-soft/50 pb-2.5 last:border-0 last:pb-0"
              >
                <p className="text-sm font-semibold text-foreground">
                  {item.quantity}× {item.product_name}
                </p>
                <span className="shrink-0 text-sm font-bold text-foreground">
                  {formatCurrency(item.subtotal)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>

      {data.tenant && (
        <CustomerPayModal
          isOpen={!!paymentFlow.target}
          onClose={() => paymentFlow.pickTarget(null)}
          onConfirm={paymentFlow.confirmIntent}
          total={
            paymentFlow.target?.kind === "full"
              ? paymentFlow.target.amount
              : data.order.balance_due
          }
          tenantId={data.tenant.id}
          tenantName={data.tenant.name}
          loading={paymentFlow.submitting}
          error={paymentFlow.error}
          description="Pago de tu pedido"
          requirePhone
        />
      )}
    </CustomerScreen>
  );
}
