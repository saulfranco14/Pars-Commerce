"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import useSWR, { mutate } from "swr";
import { Banknote, ChevronRight, Plus, WalletCards } from "lucide-react";

import { PageHeader } from "@/components/admin/PageHeader";
import { FormSheet } from "@/components/ui/FormSheet";
import { CurrencyInput } from "@/components/ui/CurrencyInput";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";

type Customer = { id: string; name: string; phone?: string | null; email?: string | null };
type CreditMovement = {
  id: string;
  movement_type: string;
  debt_delta: number | string;
  stored_balance_delta: number | string;
  received_amount: number | string;
  change_amount: number | string;
  debt_after: number | string;
  stored_balance_after: number | string;
  note?: string | null;
  created_at: string;
};
type CreditAccount = {
  id: string;
  customer_id: string;
  credit_limit: number | string;
  debt_balance: number | string;
  stored_balance: number | string;
  status: "active" | "suspended" | "closed";
  internal_notes?: string | null;
  customer?: Customer | null;
  movements?: CreditMovement[];
};

const money = (amount: number | string) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(amount));

const STATUS_LABEL: Record<CreditAccount["status"], string> = {
  active: "Activo",
  suspended: "Suspendido",
  closed: "Cerrado",
};

function decimalValue(value: string) {
  return Number(value || 0);
}

export default function CreditoPage() {
  const params = useParams<{ tenantSlug: string }>();
  const tenant = useActiveTenant();
  const [createOpen, setCreateOpen] = useState(false);
  const [payment, setPayment] = useState<CreditAccount | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [limit, setLimit] = useState("");
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [overage, setOverage] = useState<"return_change" | "store_balance">(
    "return_change",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const accountsKey = tenant
    ? `/api/credit-accounts?tenant_id=${encodeURIComponent(tenant.id)}`
    : null;
  const customersKey = tenant
    ? `/api/customers?tenant_id=${encodeURIComponent(tenant.id)}`
    : null;
  const { data: accounts, isLoading } = useSWR<CreditAccount[]>(
    accountsKey,
    swrFetcher,
    { fallbackData: [] },
  );
  const { data: customers } = useSWR<Customer[]>(customersKey, swrFetcher, {
    fallbackData: [],
  });

  async function createAccount() {
    if (!tenant || !customerId || decimalValue(limit) <= 0) {
      setMessage("Selecciona un cliente e indica un límite mayor a $0.00.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/credit-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          customer_id: customerId,
          credit_limit: decimalValue(limit),
          internal_notes: note,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos autorizar el crédito.");
      await mutate(accountsKey);
      setCreateOpen(false);
      setCustomerId("");
      setLimit("");
      setNote("");
      setMessage("Línea de crédito autorizada. Ya puedes registrar una venta a crédito.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos autorizar el crédito.");
    } finally {
      setSaving(false);
    }
  }

  async function pay() {
    if (!payment || decimalValue(amount) <= 0) {
      setMessage("Indica el monto que el cliente entregó.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/credit-accounts/${payment.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: decimalValue(amount),
          overage_action: overage,
          payment_method: "efectivo",
          note: paymentNote,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "No pudimos registrar el abono.");
      await mutate(accountsKey);
      setPayment(null);
      setAmount("");
      setPaymentNote("");
      setMessage(
        result.change_amount > 0
          ? `Abono aplicado. Devuelve ${money(result.change_amount)} al cliente.`
          : result.stored_amount > 0
            ? `Abono aplicado. ${money(result.stored_amount)} quedó como saldo a favor.`
            : "Abono aplicado correctamente.",
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos registrar el abono.");
    } finally {
      setSaving(false);
    }
  }

  if (!tenant) {
    return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        eyebrow="Cobranza"
        title="Crédito de clientes"
        description="Autoriza fiado, registra abonos y consulta cada movimiento sin perder el control de la deuda."
        action={
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90 sm:w-auto"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Autorizar crédito
          </button>
        }
      />

      <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Así funciona el fiado</p>
        <p className="mt-1">Abre la cuenta del cliente, crea su orden desde ahí y al terminar elige “Agregar a crédito”. Cada venta y cada abono quedarán en su historial.</p>
      </section>

      {message && (
        <p role="status" className="rounded-xl border border-border bg-surface-raised px-4 py-3 text-sm text-muted-foreground">
          {message}
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2"><div className="h-60 animate-pulse rounded-2xl bg-border-soft" /><div className="h-60 animate-pulse rounded-2xl bg-border-soft" /></div>
      ) : accounts?.length ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {accounts.map((account) => {
            const available = Number(account.credit_limit) - Number(account.debt_balance);
            return (
              <article key={account.id} className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-foreground">{account.customer?.name ?? "Cliente"}</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">Límite autorizado: {money(account.credit_limit)}</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    {STATUS_LABEL[account.status]}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-surface-raised p-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Debe hoy</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{money(account.debt_balance)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Disponible</p>
                    <p className="mt-0.5 text-lg font-bold tabular-nums text-foreground">{money(available)}</p>
                  </div>
                  {Number(account.stored_balance) > 0 && (
                    <p className="col-span-2 border-t border-border-soft pt-2 text-xs font-semibold text-emerald-700">
                      Saldo a favor: {money(account.stored_balance)}
                    </p>
                  )}
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link
                    href={`/dashboard/${params.tenantSlug}/credito/${account.id}`}
                    className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3 text-sm font-semibold text-foreground transition-colors hover:bg-border-soft/60"
                  >
                    Ver cuenta <ChevronRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setPayment(account);
                      setAmount(String(account.debt_balance));
                      setOverage("return_change");
                      setPaymentNote("");
                    }}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    <Banknote className="h-4 w-4" aria-hidden /> Registrar abono
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
          <WalletCards className="mx-auto h-8 w-8 text-accent" aria-hidden />
          <h2 className="mt-3 font-bold text-foreground">Sin líneas de crédito</h2>
          <p className="mt-1 text-sm text-muted-foreground">Autoriza crédito sólo a clientes que el negocio conoce.</p>
        </div>
      )}

      <FormSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Autorizar crédito"
        description="El límite controla deuda por productos y servicios; no es efectivo prestado."
        icon={WalletCards}
        footer={<button type="button" disabled={saving} onClick={() => void createAccount()} className="min-h-12 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Guardando…" : "Guardar línea de crédito"}</button>}
      >
        <div className="space-y-5">
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            <span>Cliente</span>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className="select-custom min-h-12 w-full rounded-xl border border-border bg-surface px-3 text-base font-normal text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20">
              <option value="">Selecciona un cliente</option>
              {customers?.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}
            </select>
          </label>
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            <span>Límite autorizado</span>
            <CurrencyInput value={limit} onValueChange={setLimit} placeholder="0.00" aria-label="Límite autorizado en pesos mexicanos" />
            <span className="block text-xs font-normal text-muted-foreground">Ejemplo: MX$ 800.00. No se puede superar sin autorización.</span>
          </label>
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            <span>Nota interna <span className="font-normal text-muted-foreground">(opcional)</span></span>
            <textarea value={note} onChange={(event) => setNote(event.target.value)} className="input-form min-h-28 w-full resize-y rounded-xl px-3 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Se revisa cada viernes; sólo compras de material." />
          </label>
        </div>
      </FormSheet>

      <FormSheet
        isOpen={Boolean(payment)}
        onClose={() => setPayment(null)}
        title="Registrar abono"
        description="Tlaco liquida primero la deuda real y deja claro qué pasa con un excedente."
        icon={Banknote}
        footer={<button type="button" disabled={saving} onClick={() => void pay()} className="min-h-12 w-full rounded-xl bg-accent text-sm font-bold text-accent-foreground disabled:opacity-50">{saving ? "Aplicando…" : "Aplicar abono"}</button>}
      >
        <div className="space-y-5">
          <div className="rounded-xl bg-surface-raised p-4">
            <p className="text-xs text-muted-foreground">Deuda actual de {payment?.customer?.name ?? "este cliente"}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">{money(payment?.debt_balance ?? 0)}</p>
          </div>
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            <span>Monto recibido</span>
            <CurrencyInput value={amount} onValueChange={setAmount} placeholder="0.00" aria-label="Monto recibido en pesos mexicanos" />
          </label>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-foreground">Si el cliente entrega más de su deuda</legend>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-foreground has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="overage" checked={overage === "return_change"} onChange={() => setOverage("return_change")} className="h-4 w-4 accent-accent" />
              <span><strong className="block">Devolver cambio</strong><span className="text-xs text-muted-foreground">El excedente no se guarda.</span></span>
            </label>
            <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-foreground has-[:checked]:border-accent has-[:checked]:bg-accent/5">
              <input type="radio" name="overage" checked={overage === "store_balance"} onChange={() => setOverage("store_balance")} className="h-4 w-4 accent-accent" />
              <span><strong className="block">Dejar saldo a favor</strong><span className="text-xs text-muted-foreground">Se usa primero en la próxima compra.</span></span>
            </label>
          </fieldset>
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            <span>Nota interna <span className="font-normal text-muted-foreground">(opcional)</span></span>
            <textarea value={paymentNote} onChange={(event) => setPaymentNote(event.target.value)} className="input-form min-h-24 w-full resize-y rounded-xl px-3 py-3 text-base text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20" placeholder="Ej. Abono recibido en mostrador." />
          </label>
        </div>
      </FormSheet>
    </div>
  );
}
