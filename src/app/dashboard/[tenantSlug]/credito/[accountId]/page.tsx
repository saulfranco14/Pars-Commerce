"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { ArrowLeft, ArrowUpRight, Banknote, ClipboardList, WalletCards } from "lucide-react";

import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { PageHeader } from "@/components/admin/PageHeader";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";

type CreditMovement = {
  id: string;
  movement_type: string;
  debt_delta: number | string;
  stored_balance_delta: number | string;
  received_amount: number | string;
  change_amount: number | string;
  debt_after: number | string;
  stored_balance_after: number | string;
  order_id?: string | null;
  note?: string | null;
  created_at: string;
};
type CreditAccount = {
  id: string;
  customer_id: string;
  credit_limit: number | string;
  debt_balance: number | string;
  stored_balance: number | string;
  status: string;
  internal_notes?: string | null;
  customer?: { name: string; phone?: string | null; email?: string | null } | null;
  movements?: CreditMovement[];
};

const money = (amount: number | string) =>
  new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(Number(amount));

function movementTitle(type: string) {
  return {
    charge: "Compra a crédito",
    payment: "Abono recibido",
    deposit: "Saldo a favor registrado",
    stored_balance_used: "Saldo a favor aplicado",
    change_returned: "Cambio entregado",
    refund: "Saldo a favor devuelto",
    limit_adjustment: "Límite actualizado",
    manual_adjustment: "Ajuste manual",
  }[type] ?? type.replaceAll("_", " ");
}

function movementAmount(movement: CreditMovement) {
  const debt = Number(movement.debt_delta);
  const stored = Number(movement.stored_balance_delta);
  const received = Number(movement.received_amount);
  const amount = debt || stored || received || Number(movement.change_amount);
  return { amount: Math.abs(amount), positive: debt > 0 || stored > 0 };
}

export default function CreditoDetallePage() {
  const params = useParams<{ tenantSlug: string; accountId: string }>();
  const tenant = useActiveTenant();
  const accountKey = tenant
    ? `/api/credit-accounts?tenant_id=${encodeURIComponent(tenant.id)}&account_id=${encodeURIComponent(params.accountId)}`
    : null;
  const { data, isLoading, error } = useSWR<CreditAccount[]>(accountKey, swrFetcher);
  const account = data?.[0];

  if (!tenant) return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;
  if (isLoading) return <LoadingBlock message="Cargando cuenta de crédito…" variant="skeleton" />;
  if (error || !account) return <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">No encontramos esta cuenta de crédito.</div>;

  const available = Number(account.credit_limit) - Number(account.debt_balance);
  const newOrderHref = `/dashboard/${params.tenantSlug}/ordenes/nueva?customer_id=${encodeURIComponent(account.customer_id)}`;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <Link href={`/dashboard/${params.tenantSlug}/credito`} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden /> Volver a crédito de clientes
      </Link>
      <PageHeader
        eyebrow="Cuenta de crédito"
        title={account.customer?.name ?? "Cliente"}
        description={account.customer?.phone || account.customer?.email || "Historial de fiado y abonos del cliente."}
        action={
          <Link href={newOrderHref} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 sm:w-auto">
            <ClipboardList className="h-4 w-4" aria-hidden /> Nueva venta a crédito
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><p className="text-xs text-muted-foreground">Deuda actual</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{money(account.debt_balance)}</p></div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><p className="text-xs text-muted-foreground">Crédito disponible</p><p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{money(available)}</p><p className="mt-1 text-xs text-muted-foreground">De un límite de {money(account.credit_limit)}</p></div>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm"><p className="text-xs text-muted-foreground">Saldo a favor</p><p className="mt-1 text-2xl font-bold tabular-nums text-emerald-700">{money(account.stored_balance)}</p><p className="mt-1 text-xs text-muted-foreground">Se aplica primero en la próxima compra.</p></div>
      </section>

      {account.internal_notes && <section className="rounded-2xl border border-border bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nota interna</p><p className="mt-2 text-sm text-foreground">{account.internal_notes}</p></section>}

      <section className="rounded-2xl border border-border bg-surface shadow-sm">
        <div className="flex items-center gap-3 border-b border-border-soft px-4 py-4"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent"><WalletCards className="h-5 w-5" aria-hidden /></span><div><h2 className="font-bold text-foreground">Movimientos de la cuenta</h2><p className="text-sm text-muted-foreground">Cada compra, abono, cambio o saldo a favor queda registrado aquí.</p></div></div>
        {account.movements?.length ? <ol className="divide-y divide-border-soft">{account.movements.map((movement) => { const detail = movementAmount(movement); return <li key={movement.id} className="flex gap-3 px-4 py-4"><span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${detail.positive ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}><Banknote className="h-4 w-4" aria-hidden /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><p className="font-semibold text-foreground">{movementTitle(movement.movement_type)}</p><p className={`font-bold tabular-nums ${detail.positive ? "text-amber-800" : "text-emerald-700"}`}>{detail.positive ? "+" : "−"}{money(detail.amount)}</p></div><p className="mt-0.5 text-xs text-muted-foreground">{new Date(movement.created_at).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })}</p>{movement.note && <p className="mt-2 text-sm text-muted-foreground">{movement.note}</p>}{movement.order_id && <Link href={`/dashboard/${params.tenantSlug}/ordenes/${movement.order_id}`} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline">Ver orden <ArrowUpRight className="h-3 w-3" aria-hidden /></Link>}<p className="mt-2 text-xs text-muted-foreground">Deuda: {money(movement.debt_after)} · Saldo a favor: {money(movement.stored_balance_after)}</p></div></li>; })}</ol> : <div className="p-8 text-center text-sm text-muted-foreground">Aún no hay movimientos. Crea una venta a crédito desde esta cuenta para comenzar.</div>}
      </section>
    </div>
  );
}
