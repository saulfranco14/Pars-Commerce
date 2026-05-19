"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { PaymentReceipt } from "@/features/qr/components/PaymentReceipt";
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
      <main className="mx-auto w-full max-w-md px-4 py-6">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Falta order_id en la URL.
        </p>
      </main>
    );
  }

  if (isLoading && !data) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Verificando pago...</p>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-6">
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          No pudimos verificar el pago. Vuelve a la cuenta.
        </p>
        <Link
          href={`/q/${token}/table/bill?order_id=${orderId}`}
          className="mt-3 inline-flex min-h-[48px] items-center justify-center rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-accent-foreground"
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
          <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            ¿Tarda demasiado? El pago puede llegar en unos minutos. Puedes
            volver a la cuenta y revisar después.
          </p>
        )}
        <Link
          href={`/q/${token}/table/bill?order_id=${orderId}`}
          className="mt-5 inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground hover:bg-border-soft/40"
        >
          Ir a la cuenta
        </Link>
      </div>
    </main>
  );
}
