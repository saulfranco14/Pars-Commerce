"use client";

import { useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { CheckCircle2, Receipt } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { CustomerScreenLayout } from "@/features/qr/components/CustomerScreenLayout";
import { BillSummary } from "@/features/qr/components/BillSummary";
import { BillSplitSection } from "@/features/qr/components/BillSplitSection";
import { BillActionsSection } from "@/features/qr/components/BillActionsSection";
import { CustomerPayModal } from "@/features/qr/components/CustomerPayModal";
import { PaymentMethodHero } from "@/features/qr/components/PaymentMethodHero";
import { PaymentMethodStep } from "@/features/qr/components/PaymentMethodStep";
import { PaymentReceipt } from "@/features/qr/components/PaymentReceipt";

import { useBillData } from "@/features/qr/hooks/useBillData";
import { usePaymentFlow } from "@/features/qr/hooks/usePaymentFlow";
import { useSplitBill } from "@/features/qr/hooks/useSplitBill";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";

export default function TableBillPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const orderId = searchParams.get("order_id");
  const splitEnabled = searchParams.get("split") === "1";

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
    orderId: orderId ?? "",
    qrToken: token,
    fingerprint,
    onSubmitted: refresh,
  });

  const splitForm = useSplitBill({
    orderId: orderId ?? "",
    onSubmitted: refresh,
  });

  // While a pending payment exists, check if the linked group has been
  // approved by the admin. SWR is already polling so the UI updates by itself.
  const pendingGroupStatus = useMemo(() => {
    if (!paymentFlow.pending || !data) return null;
    const g = data.groups.find(
      (x) => x.id === paymentFlow.pending!.splitGroupId,
    );
    return g?.payment_status ?? null;
  }, [paymentFlow.pending, data]);

  // For OTHER users in the same mesa: detect a pending_validation group
  // they didn't initiate, so they see the same receipt instead of being
  // able to pay it again.
  const sharedPendingGroup = useMemo(() => {
    if (!data || paymentFlow.pending) return null;
    return (
      data.groups.find((g) => g.payment_status === "pending_validation") ?? null
    );
  }, [data, paymentFlow.pending]);

  if (!orderId) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 py-6 text-sm text-muted-foreground">
        Falta order_id en la URL.
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Cargando cuenta...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-xl px-4 py-6">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No se pudo cargar la cuenta.
        </p>
      </main>
    );
  }

  /* ---------- Receipt screen (after submitting payment intent) ---------- */
  if (paymentFlow.pending) {
    const status =
      pendingGroupStatus === "paid" ? "approved" : "pending_validation";
    return (
      <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-6">
        <PaymentReceipt
          amount={paymentFlow.pending.amount}
          method={paymentFlow.pending.method}
          paidAt={paymentFlow.pending.submittedAt}
          businessName={data.tenant?.name}
          tableLabel={data.qr_code?.label}
          status={status}
          onClose={paymentFlow.dismissPending}
          onRefresh={refresh}
          refreshing={refreshing}
        />
      </main>
    );
  }

  /* ---------- Shared pending screen — another user already initiated the
                payment for the whole bill. Show them the same waiting state
                so they don't double-pay. ---------- */
  if (sharedPendingGroup && data.order.status !== "paid") {
    const amount = Number(
      sharedPendingGroup.balance_due || sharedPendingGroup.total,
    );
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background px-4 py-6">
        <PaymentReceipt
          amount={amount}
          method={(data.order.payment_method as CustomerPayMethod) ?? "efectivo"}
          paidAt={new Date().toISOString()}
          businessName={data.tenant?.name}
          tableLabel={data.qr_code?.label}
          status="pending_validation"
          onClose={() => {
            window.location.href = `/q/${token}`;
          }}
          onRefresh={refresh}
          refreshing={refreshing}
        />
        <p className="max-w-md text-center text-xs text-muted-foreground">
          Otro comensal de esta mesa ya marcó el pago. Esperamos la
          confirmación del negocio.
        </p>
      </main>
    );
  }

  /* ---------- Method step (after picking method in the modal) ---------- */
  if (paymentFlow.method && paymentFlow.target && data.tenant) {
    const amount =
      paymentFlow.target.kind === "group"
        ? Number(
            paymentFlow.target.group.balance_due ||
              paymentFlow.target.group.total,
          )
        : paymentFlow.target.amount;

    return (
      <CustomerScreenLayout
        hero={<PaymentMethodHero method={paymentFlow.method} amount={amount} />}
        tenantName={data.tenant.name}
        onBack={() => paymentFlow.pickTarget(null)}
      >
        <PaymentMethodStep
          method={paymentFlow.method}
          amount={amount}
          tenantId={data.tenant.id}
          tenantName={data.tenant.name}
          tableLabel={data.qr_code?.label}
          onConfirm={paymentFlow.confirmIntent}
          onBack={paymentFlow.backToMethodPicker}
          loading={paymentFlow.submitting}
          error={paymentFlow.error}
        />
      </CustomerScreenLayout>
    );
  }

  /* ---------- Default: bill view ---------- */

  const isPaid = data.order.status === "paid";
  const deviceCount = data.devices.length;
  const hasSplitGroups =
    data.groups.length > 1 ||
    (data.groups.length === 1 && data.groups[0].device_id !== null);
  const canSplit = deviceCount >= 2 && !hasSplitGroups;
  const hasItems = data.items.length > 0;

  function formatCurrency(value: number) {
    return `$${Number(value).toLocaleString("es-MX", {
      minimumFractionDigits: 2,
    })}`;
  }

  const hero = (
    <div className="w-full">
      <div className="flex items-center gap-2">
        <Receipt className="h-5 w-5" strokeWidth={2.5} />
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
            Tu cuenta
          </p>
          {data.qr_code?.label && (
            <p className="text-base font-bold tracking-tight">
              {data.qr_code.label}
            </p>
          )}
        </div>
        {isPaid && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider backdrop-blur-sm">
            <CheckCircle2 className="h-3 w-3" />
            Pagada
          </span>
        )}
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
          {isPaid ? "Total pagado" : "Total"}
        </p>
        <p className="mt-0.5 text-5xl font-bold tracking-tight lg:text-6xl">
          {formatCurrency(data.order.total)}
        </p>
      </div>

      {!isPaid && (data.order.paid_total > 0 || data.order.balance_due > 0) && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.order.paid_total > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Pagado
              </p>
              <p className="text-sm font-bold">
                {formatCurrency(data.order.paid_total)}
              </p>
            </div>
          )}
          {data.order.balance_due > 0 && (
            <div className="rounded-xl bg-white/15 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
                Por pagar
              </p>
              <p className="text-sm font-bold">
                {formatCurrency(data.order.balance_due)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <CustomerScreenLayout
      hero={hero}
      heroBgClass={isPaid ? "bg-emerald-600" : "bg-accent"}
      backHref={`/q/${token}`}
      tenantName={data.tenant?.name}
    >
      <div className="space-y-3">
        <BillSummary
          items={data.items}
          devices={data.devices}
          groups={data.groups}
          currentDeviceId={data.my_device_id}
          onPayGroup={(g) => paymentFlow.pickTarget({ kind: "group", group: g })}
        />

        {isPaid ? (
          <Notification
            tone="success"
            title="¡Cuenta pagada por completo!"
            message="Gracias por tu visita."
          />
        ) : splitEnabled && canSplit ? (
          <BillSplitSection
            mode={splitForm.mode}
            onModeChange={splitForm.setMode}
            peopleCount={splitForm.peopleCount}
            onPeopleCountChange={splitForm.setPeopleCount}
            onItemsAssignmentChange={splitForm.setAssignedGroups}
            items={data.items.map((i) => ({
              id: i.id,
              product_name: i.product_name,
              quantity: i.quantity,
              subtotal: i.subtotal,
            }))}
            deviceCount={deviceCount}
            orderTotal={data.order.total}
            submitting={splitForm.submitting}
            error={splitForm.error}
            onSubmit={splitForm.submit}
          />
        ) : splitEnabled && !canSplit && !hasSplitGroups ? (
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-sm font-bold text-foreground">
              Aún están solos en esta cuenta.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Para dividir, comparte el QR de la mesa con quien quiera unirse.
              Cuando otra persona se conecte podrán dividir.
            </p>
          </div>
        ) : (
          <BillActionsSection
            token={token}
            orderId={orderId}
            balanceDue={data.order.balance_due}
            showPay={!hasSplitGroups && hasItems}
            showSplit={hasItems && canSplit}
            showSingleDeviceHint={
              !canSplit && hasItems && !hasSplitGroups && deviceCount === 1
            }
            onPay={() =>
              paymentFlow.pickTarget({
                kind: "full",
                amount: data.order.balance_due,
              })
            }
          />
        )}
      </div>

      <CustomerPayModal
        isOpen={!!paymentFlow.target && !paymentFlow.method}
        onClose={() => paymentFlow.pickTarget(null)}
        onConfirm={paymentFlow.pickMethod}
        total={
          paymentFlow.target?.kind === "group"
            ? Number(
                paymentFlow.target.group.balance_due ||
                  paymentFlow.target.group.total,
              )
            : (paymentFlow.target?.amount ?? 0)
        }
        description={
          paymentFlow.target?.kind === "group"
            ? `Pago de ${paymentFlow.target.group.label}`
            : "Pago total de la cuenta"
        }
      />
    </CustomerScreenLayout>
  );
}
