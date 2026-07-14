"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CreditCard, Link2, PlusCircle, RotateCcw, Users } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Notification } from "@/components/ui/Notification";
import { CustomerScreen } from "@/features/qr/components/CustomerScreen";
import { BillScreenSkeleton } from "@/features/qr/components/BillScreenSkeleton";
import { BillHero } from "@/features/qr/components/BillHero";
import { BillSummary } from "@/features/qr/components/BillSummary";
import { BillSplitSection } from "@/features/qr/components/BillSplitSection";
import { CustomerPayModal } from "@/features/qr/components/CustomerPayModal";
import { CustomerMergeSheet } from "@/features/qr/components/CustomerMergeSheet";
import { MergeRequestBanner } from "@/features/qr/components/MergeRequestBanner";
import { PaymentReceipt } from "@/features/qr/components/PaymentReceipt";

import { formatCurrency } from "@/features/qr/helpers/format";
import { getLastOrderId } from "@/features/qr/helpers/deviceFingerprint";
import { useBillData } from "@/features/qr/hooks/useBillData";
import { usePaymentFlow } from "@/features/qr/hooks/usePaymentFlow";
import { useSplitBill } from "@/features/qr/hooks/useSplitBill";
import { useCustomerMerge } from "@/features/qr/hooks/useCustomerMerge";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";

export default function TableBillPage() {
  const params = useParams();
  const router = useRouter();
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

  // Once THIS device paid THIS order, going back to /q/{token} would scan
  // the QR again and — since the table is now free — silently open a brand
  // new order. Only this device (the one whose fingerprint is cached as the
  // last order for this token) is asked to confirm; any other device
  // scanning the same QR is a genuinely new customer, no confirmation needed.
  const [confirmNewOrder, setConfirmNewOrder] = useState(false);
  function goToQrRoot() {
    if (orderId && getLastOrderId(token) === orderId) {
      setConfirmNewOrder(true);
      return;
    }
    router.push(`/q/${token}`);
  }

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

  const [mergeOpen, setMergeOpen] = useState(false);
  const merge = useCustomerMerge({
    orderId: orderId ?? "",
    fingerprint,
    onMerged: refresh,
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
      <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-6">
        <Notification
          tone="error"
          title="No pudimos abrir tu cuenta"
          message="Falta la referencia de la orden. Vuelve a escanear el código QR de tu mesa."
        />
      </main>
    );
  }

  // Skeleton screen mirroring the bill layout — replaces in place, no jump.
  if (isLoading && !data) {
    return <BillScreenSkeleton />;
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center px-4 py-6">
        <Notification
          tone="error"
          title="No se pudo cargar la cuenta"
          message="Revisa tu conexión e inténtalo de nuevo en unos segundos."
        />
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
          Alguien más de esta mesa ya marcó el pago. Esperamos la
          confirmación del negocio.
        </p>
      </main>
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

  // Payment is blocked until the business marks preparation as ready. Per-person:
  // gate on THIS caller's own state when we know it (someone else not being
  // ready shouldn't block me), else fall back to the order-level summary.
  // Mirrors the server-side guard (defense in depth).
  const myReady =
    data.my_fulfillment_status != null
      ? data.my_fulfillment_status === "ready"
      : data.order.fulfillment_status === "ready";
  const isReady = isPaid || myReady;

  // Some lines can be ready while others aren't (a drink comes out before a
  // service). Distinguish that from "nothing has started yet" so the banner
  // doesn't read as if the whole order were untouched.
  const readyItemCount = data.items.filter(
    (i) => i.fulfillment_status === "ready",
  ).length;
  const hasPartialProgress =
    !isReady && readyItemCount > 0 && readyItemCount < data.items.length;

  // The split-picker screen is a distinct sub-view: body shows the controls,
  // the "Confirmar división" CTA lives in the fixed footer below.
  const inSplitPicker = !isPaid && splitEnabled && canSplit;

  const showPay = !isPaid && !hasSplitGroups && hasItems && isReady;
  const showSplitButton = !isPaid && hasItems && canSplit;

  /* ---------- Footer (fixed) — CTA stays visible regardless of list length -- */
  let footer: React.ReactNode = null;
  if (inSplitPicker) {
    footer = (
      <button
        type="button"
        onClick={splitForm.submit}
        disabled={splitForm.submitting}
        className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Users className="h-5 w-5" />
        {splitForm.submitting ? "Dividiendo..." : "Confirmar división"}
      </button>
    );
  } else if (!isPaid) {
    footer = (
      <div className="space-y-2">
        {showPay && (
          <button
            type="button"
            onClick={() =>
              paymentFlow.pickTarget({
                kind: "full",
                amount: data.order.balance_due,
              })
            }
            className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
          >
            <CreditCard className="h-5 w-5" />
            Pagar {formatCurrency(data.order.balance_due)}
          </button>
        )}
        <div
          className={`grid gap-2 ${showSplitButton ? "grid-cols-2" : "grid-cols-1"}`}
        >
          <Link
            href={`/q/${token}`}
            className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40"
          >
            <PlusCircle className="h-4 w-4 text-muted-foreground" />
            Agregar más
          </Link>
          {showSplitButton && (
            <Link
              href={`/q/${token}/table/bill?order_id=${orderId}&split=1`}
              className="inline-flex min-h-[48px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40"
            >
              <Users className="h-4 w-4 text-muted-foreground" />
              Dividir
            </Link>
          )}
        </div>
        {!hasSplitGroups &&
          !data.outgoing_merge_request &&
          !data.incoming_merge_request && (
            <button
              type="button"
              onClick={() => setMergeOpen(true)}
              className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-accent"
            >
              <Link2 className="h-3.5 w-3.5" />
              Unir con otra mesa
            </button>
          )}
      </div>
    );
  }

  return (
    <CustomerScreen
      tone={isPaid ? "success" : "accent"}
      tenantName={data.tenant?.name}
      // Paid: no plain link back to /q/{token} — that route re-scans the QR
      // and, since the table is free now, silently opens a new order. The
      // dedicated "Ordenar de nuevo" button below (with its own confirm gate)
      // is the only way back from here.
      {...(isPaid
        ? {}
        : {
            backHref: inSplitPicker
              ? `/q/${token}/table/bill?order_id=${orderId}`
              : `/q/${token}`,
          })}
      header={
        <BillHero
          tableLabel={data.qr_code?.label}
          tenantName={data.tenant?.name}
          tenantLogoUrl={data.tenant?.logo_url}
          total={data.order.total}
          paidTotal={data.order.paid_total}
          balanceDue={data.order.balance_due}
          isPaid={isPaid}
        />
      }
      footer={footer}
    >
      <div className="space-y-3">
        {/* Incoming merge request → this table's owner decides */}
        {!isPaid && data.incoming_merge_request && data.i_am_owner && (
          <MergeRequestBanner
            kind="incoming"
            otherLabel={data.incoming_merge_request.requester_label}
            busy={merge.merging}
            onApprove={() =>
              merge.respond(data.incoming_merge_request!.id, "approved")
            }
            onDecline={() =>
              merge.respond(data.incoming_merge_request!.id, "declined")
            }
          />
        )}

        {/* Outgoing merge request → this table is waiting for approval */}
        {!isPaid && data.outgoing_merge_request && (
          <MergeRequestBanner
            kind="outgoing"
            otherLabel={data.outgoing_merge_request.target_label}
            busy={merge.merging}
            onCancel={() =>
              merge.respond(data.outgoing_merge_request!.id, "cancelled")
            }
          />
        )}

        {data.is_linked && (data.linked_labels?.length ?? 0) > 0 && (
          <Notification
            tone="info"
            title="Cuenta unida"
            message={`Estás viendo la cuenta combinada de ${data.linked_labels!.join(" + ")}.`}
          />
        )}

        {!isPaid && !isReady && hasItems && (
          <Notification
            tone="info"
            title={hasPartialProgress ? "Parte de tu pedido ya está lista" : "En preparación"}
            message={
              hasPartialProgress
                ? `${readyItemCount} de ${data.items.length} productos ya están listos. Revisa el detalle abajo — podrás pagar en cuanto estén todos.`
                : "El negocio está preparando tu pedido. Podrás pagar en cuanto lo marque como listo."
            }
          />
        )}

        <BillSummary
          items={data.items}
          devices={data.devices}
          groups={data.groups}
          currentDeviceId={data.my_device_id}
          onPayGroup={(g) => paymentFlow.pickTarget({ kind: "group", group: g })}
          canPay={isReady}
        />

        {isPaid ? (
          <>
            <Notification
              tone="success"
              title="¡Cuenta pagada por completo!"
              message="Gracias por tu visita."
            />
            <button
              type="button"
              onClick={goToQrRoot}
              className="flex min-h-[48px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Ordenar de nuevo
            </button>
          </>
        ) : inSplitPicker ? (
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
            error={splitForm.error}
          />
        ) : splitEnabled && !canSplit && !hasSplitGroups ? (
          <Notification
            tone="info"
            title="Aún están solos en esta cuenta"
            message="Para dividir, comparte el QR de la mesa con quien quiera unirse. Cuando otra persona se conecte podrán dividir."
          />
        ) : null}
      </div>

      {data.tenant && (
        <CustomerPayModal
          isOpen={!!paymentFlow.target}
          onClose={() => paymentFlow.pickTarget(null)}
          onConfirm={paymentFlow.confirmIntent}
          total={
            paymentFlow.target?.kind === "group"
              ? Number(
                  paymentFlow.target.group.balance_due ||
                    paymentFlow.target.group.total,
                )
              : (paymentFlow.target?.amount ?? 0)
          }
          tenantId={data.tenant.id}
          tenantName={data.tenant.name}
          tableLabel={data.qr_code?.label}
          loading={paymentFlow.submitting}
          error={paymentFlow.error}
          description={
            paymentFlow.target?.kind === "group"
              ? `Pago de ${paymentFlow.target.group.label}`
              : "Pago total de la cuenta"
          }
        />
      )}

      <CustomerMergeSheet
        isOpen={mergeOpen}
        onClose={() => {
          if (merge.merging) return;
          setMergeOpen(false);
          merge.resetError();
        }}
        candidates={merge.candidates}
        loading={merge.loading}
        merging={merge.merging}
        error={merge.error}
        onLoad={merge.loadCandidates}
        onMerge={merge.requestMerge}
      />

      <ConfirmDialog
        isOpen={confirmNewOrder}
        onClose={() => setConfirmNewOrder(false)}
        onConfirm={() => router.push(`/q/${token}`)}
        title="¿Iniciar un nuevo pedido?"
        description="Ya pagaste esta cuenta. Si continúas, se abrirá un pedido nuevo en esta mesa."
        confirmLabel="Sí, continuar"
        cancelLabel="Cancelar"
      />
    </CustomerScreen>
  );
}
