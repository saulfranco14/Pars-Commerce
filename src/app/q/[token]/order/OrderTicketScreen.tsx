"use client";

import { useMemo, useState } from "react";
import { CreditCard, ShoppingBag } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { CustomerScreen } from "@/features/qr/components/CustomerScreen";
import { BillScreenSkeleton } from "@/features/qr/components/BillScreenSkeleton";
import { CustomerPayModal } from "@/features/qr/components/CustomerPayModal";
import { PaymentReceipt } from "@/features/qr/components/PaymentReceipt";
import { formatCurrency } from "@/features/qr/helpers/format";
import { useBillData } from "@/features/qr/hooks/useBillData";
import { usePaymentFlow } from "@/features/qr/hooks/usePaymentFlow";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";
import type { QrSessionTenant } from "@/features/qr/interfaces/tableSession";

interface OrderTicketScreenProps {
  token: string;
  tenant: QrSessionTenant;
  orderId: string;
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
      className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
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
        {isPaid && (
          <Notification
            tone="success"
            title="¡Pedido pagado!"
            message="Gracias por tu compra."
          />
        )}

        <section className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-sm font-bold text-foreground">
              Productos pedidos
            </h2>
            <span className="ml-auto rounded-full bg-border-soft/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
              {data.items.length}
            </span>
          </div>
          <ul className="space-y-2.5">
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
          <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm font-bold text-foreground">Total</span>
            <span className="text-lg font-bold tracking-tight text-foreground">
              {formatCurrency(data.order.total)}
            </span>
          </div>
        </section>
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
