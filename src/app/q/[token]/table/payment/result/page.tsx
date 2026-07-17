"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { CustomerLoading } from "@/features/qr/components/customer/CustomerLoading";
import { PaymentReceipt } from "@/features/qr/components/payment/PaymentReceipt";
import { useBillData } from "@/features/qr/hooks/useBillData";

/**
 * Landing page after MercadoPago redirects the customer back. Polls the bill
 * (via useBillData with a tighter interval) until the group/order shows as
 * paid, then renders the celebratory receipt.
 *
 * Why polling instead of trusting the redirect: MP redirects can race the
 * webhook. The redirect can fire before our DB is updated. Polling closes the
 * gap without needing client-side IDs to round-trip.
 */
export default function TablePaymentResultPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const orderId = searchParams.get("order_id");
  const groupId = searchParams.get("group_id");

  const { data, isLoading, error } = useBillData(token, orderId, {
    refreshIntervalMs: 2000,
  });

  const [submittedAt] = useState<string>(() => new Date().toISOString());
  const [waitedTooLong, setWaitedTooLong] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setWaitedTooLong(true), 60_000);
    return () => clearTimeout(t);
  }, []);

  const status = useMemo(() => {
    if (!data) return "loading" as const;
    if (data.order.status === "paid") return "paid" as const;
    if (groupId) {
      const g = data.groups.find((x) => x.id === groupId);
      if (g?.payment_status === "paid") return "paid" as const;
    }
    return "waiting" as const;
  }, [data, groupId]);

  if (!orderId) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md items-center px-4 py-6">
        <Notification
          tone="error"
          title="No pudimos verificar tu pago"
          message="Falta la referencia de la orden. Vuelve a la cuenta de tu mesa."
        />
      </main>
    );
  }

  if (isLoading && !data) {
    return <CustomerLoading message="Verificando tu pago..." />;
  }

  if (error || !data) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-3 px-4 py-6">
        <Notification
          tone="error"
          title="No pudimos verificar el pago"
          message="Vuelve a la cuenta e inténtalo de nuevo."
        />
        <Link
          href={`/q/${token}/table/bill?order_id=${orderId}`}
          className="inline-flex min-h-[52px] items-center justify-center rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99]"
        >
          Ir a la cuenta
        </Link>
      </main>
    );
  }

  if (status === "paid") {
    const amount = groupId
      ? Number(
          data.groups.find((g) => g.id === groupId)?.total ?? data.order.total,
        )
      : Number(data.order.total);
    return (
      <main className="mx-auto w-full max-w-md space-y-4 px-4 py-6">
        <PaymentReceipt
          amount={amount}
          method="mercadopago"
          paidAt={submittedAt}
          businessName={data.tenant?.name}
          status="approved"
          onClose={() => {
            window.location.href = `/q/${token}/table/bill?order_id=${orderId}`;
          }}
        />
      </main>
    );
  }

  // Waiting state: webhook hasn't landed yet.
  return (
    <main className="mx-auto w-full max-w-md space-y-4 px-4 py-10">
      <div className="rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent">
          <Loader2 className="h-7 w-7 animate-spin" />
        </div>
        <h1 className="mt-3 text-lg font-semibold text-foreground">
          Procesando tu pago...
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Estamos verificando con Mercado Pago. Esto puede tardar unos segundos.
        </p>
        {waitedTooLong && (
          <div className="mt-4 text-left">
            <Notification
              tone="warning"
              message="¿Tarda demasiado? El pago puede llegar en unos minutos. Puedes volver a la cuenta y revisar después."
            />
          </div>
        )}
        <Link
          href={`/q/${token}/table/bill?order_id=${orderId}`}
          className="mt-5 inline-flex min-h-[48px] cursor-pointer items-center justify-center rounded-2xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/40"
        >
          Ir a la cuenta
        </Link>
      </div>
    </main>
  );
}
