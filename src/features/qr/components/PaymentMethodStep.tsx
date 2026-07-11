"use client";

import { useState } from "react";
import useSWR from "swr";
import { Check, Copy, Loader2, Phone } from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { formatCurrency } from "@/features/qr/helpers/format";
import { swrFetcher } from "@/lib/swrFetcher";

import type { CustomerPayMethod } from "@/features/qr/components/CustomerPayModal";
import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface PaymentMethodStepProps {
  method: CustomerPayMethod;
  amount: number;
  tenantId: string;
  tenantName: string;
  tableLabel?: string;
  onConfirm: (customerPhone?: string) => Promise<void>;
  onBack: () => void;
  loading?: boolean;
  error?: string | null;
  /** Ask an anonymous customer for a phone on manual methods. */
  requirePhone?: boolean;
}

/**
 * Method-specific detail view rendered inside the CustomerPayModal sheet:
 * the instructions/bank data for the chosen method plus the confirm CTA.
 * The sheet (amount header, method picker, back) is owned by the modal.
 */
export function PaymentMethodStep({
  method,
  amount,
  tenantId,
  tenantName,
  tableLabel,
  onConfirm,
  onBack,
  loading,
  error,
  requirePhone = false,
}: PaymentMethodStepProps) {
  const [phone, setPhone] = useState("");
  // Manual methods (cash/transfer) validated by staff need a way to reach the
  // customer; MP tracks itself. Only ask when the caller opts in (order ticket).
  const isManual = method === "efectivo" || method === "transferencia";
  const askPhone = requirePhone && isManual;
  const phoneOk = !askPhone || phone.replace(/\D/g, "").length >= 10;

  const isTransferencia = method === "transferencia";
  const key = isTransferencia
    ? `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}`
    : null;
  const { data: paymentMethods, isLoading: loadingMethods } = useSWR<
    TenantPaymentMethod[]
  >(key, swrFetcher);

  const hasActiveBankAccount =
    !isTransferencia ||
    (paymentMethods ?? []).some(
      (m) => m.is_active && m.kind === "bank_transfer",
    );

  const canConfirm =
    !loading &&
    phoneOk &&
    (!isTransferencia || (!loadingMethods && hasActiveBankAccount));

  return (
    <section className="space-y-4">
      {method === "transferencia" && (
        <TransferenciaStep tenantId={tenantId} amount={amount} />
      )}
      {method === "efectivo" && (
        <CashOrCardStep
          title="Acércate a la caja para pagar"
          description={
            tableLabel
              ? `Pasa con el personal y menciona que vienes de "${tableLabel}".`
              : "Pasa con el personal a entregar el efectivo."
          }
          amount={amount}
        />
      )}
      {method === "tarjeta" && (
        <CashOrCardStep
          title="Pídele al personal cobrar con terminal"
          description={
            tableLabel
              ? `Avísale al personal que vienes de "${tableLabel}". Cobran con su terminal.`
              : "El personal se acerca con la terminal a tomar el cobro."
          }
          amount={amount}
        />
      )}
      {method === "mercadopago" && <MercadoPagoStep amount={amount} />}

      {askPhone && (
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Tu celular
          </span>
          <div className="relative">
            <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="55 1234 5678"
              className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-10 pr-3 text-base font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Lo usamos para vincular tu pago. No te llegará spam.
          </p>
        </label>
      )}

      {error && <Notification tone="error" message={error} />}

      {isTransferencia && !loadingMethods && !hasActiveBankAccount ? (
        <div className="space-y-3">
          <Notification
            tone="warning"
            title="No puedes transferir todavía"
            message="El negocio no tiene una cuenta bancaria configurada. Por favor elige otro método de pago."
          />
          <button
            type="button"
            onClick={onBack}
            className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] transition-transform"
          >
            Elegir otro método de pago
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onConfirm(askPhone ? phone : undefined)}
          disabled={!canConfirm}
          className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 transition-all"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : method === "transferencia" ? (
            "Ya realicé la transferencia"
          ) : method === "efectivo" ? (
            "Listo, ya pagué en caja"
          ) : method === "tarjeta" ? (
            "Listo, ya pagué con tarjeta"
          ) : (
            `Continuar a Mercado Pago · ${formatCurrency(amount)}`
          )}
        </button>
      )}

      <p className="text-center text-xs text-muted-foreground">
        {method === "mercadopago"
          ? "Pago seguro procesado por Mercado Pago."
          : `Al confirmar, ${tenantName} validará que recibió tu pago y te avisaremos aquí.`}
      </p>
    </section>
  );
}

/* ---------- Method-specific body sections ---------- */

function TransferenciaStep({
  tenantId,
  amount,
}: {
  tenantId: string;
  amount: number;
}) {
  const key = `/api/tenant-payment-methods?tenant_id=${encodeURIComponent(tenantId)}`;
  const { data, isLoading } = useSWR<TenantPaymentMethod[]>(key, swrFetcher);
  const active = (data ?? []).find(
    (m) => m.is_active && m.kind === "bank_transfer",
  );

  const [copied, setCopied] = useState<string | null>(null);
  async function copy(value: string, fieldKey: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(fieldKey);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* ignore */
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando datos de la cuenta...
      </div>
    );
  }

  if (!active) return null;

  const fields: Array<{ key: string; label: string; value: string | null }> = [
    { key: "bank_name", label: "Banco", value: active.bank_name },
    {
      key: "account_holder",
      label: "Beneficiario",
      value: active.account_holder,
    },
    { key: "clabe", label: "CLABE", value: active.clabe },
    { key: "account_number", label: "Cuenta", value: active.account_number },
  ];

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold text-foreground">Datos para transferir</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Transfiere exactamente{" "}
        <span className="font-semibold text-foreground">
          {formatCurrency(amount)}
        </span>{" "}
        a esta cuenta y luego confirma abajo.
      </p>
      <dl className="mt-3 space-y-2">
        {fields
          .filter((f) => f.value)
          .map((f) => (
            <div
              key={f.key}
              className="flex items-center justify-between gap-2 rounded-xl border border-border-soft bg-background px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </dt>
                <dd className="truncate font-mono text-sm font-semibold text-foreground">
                  {f.value}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => f.value && copy(f.value, f.key)}
                aria-label={`Copiar ${f.label}`}
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-border bg-surface hover:bg-border-soft/60 transition-colors"
              >
                {copied === f.key ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            </div>
          ))}
      </dl>
    </div>
  );
}

function CashOrCardStep({
  title,
  description,
  amount,
}: {
  title: string;
  description: string;
  amount: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold text-foreground">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      <div className="mt-3 flex items-baseline justify-between rounded-xl bg-border-soft/40 px-4 py-3">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Total a pagar
        </p>
        <p className="text-2xl font-bold text-foreground">
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}

function MercadoPagoStep({ amount }: { amount: number }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-sm font-bold text-foreground">
        Te llevaremos al checkout seguro de Mercado Pago.
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Puedes pagar con tarjeta, débito o SPEI. Al terminar regresarás aquí
        automáticamente.
      </p>
      <div className="mt-3 flex items-baseline justify-between rounded-xl bg-border-soft/40 px-4 py-2.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Cargo total
        </p>
        <p className="text-xl font-bold text-foreground">
          {formatCurrency(amount)}
        </p>
      </div>
    </div>
  );
}
