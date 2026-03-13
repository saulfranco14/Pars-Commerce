"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import useSWR, { mutate } from "swr";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  CreditCard,
  Link2,
  Banknote,
  ExternalLink,
  CalendarClock,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import { btnPrimary, btnSecondary, btnDanger } from "@/components/ui/buttonClasses";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { useActiveTenant } from "@/stores/useTenantStore";
import { swrFetcher } from "@/lib/swrFetcher";
import {
  LOAN_STATUS_LABEL,
  LOAN_PAYMENT_METHOD_LABEL,
  formatMXN,
  calcInterestAccrued,
  isLoanOverdue,
} from "@/lib/loanUtils";
import type { Loan, LoanPayment, LoanPaymentMethod } from "@/types/loans";
import type { Customer } from "@/types/customers";

type LoanDetail = Loan & {
  customer: Customer | null;
  payments: (LoanPayment & {
    registered_by_profile: { id: string; display_name: string | null } | null;
  })[];
  order?: { id: string; status: string; total: number; created_at: string } | null;
};

function LoanStatusBadge({ loan }: { loan: Loan }) {
  const overdue = isLoanOverdue(loan);
  if (loan.status === "paid") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
        <CheckCircle2 className="h-4 w-4" /> Pagado
      </span>
    );
  }
  if (loan.status === "cancelled") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600">
        <XCircle className="h-4 w-4" /> Cancelado
      </span>
    );
  }
  if (overdue) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-700">
        <AlertTriangle className="h-4 w-4" /> Vencido
      </span>
    );
  }
  if (loan.status === "partial") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
        <Clock className="h-4 w-4" /> Pago parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-700">
      <Clock className="h-4 w-4" /> Pendiente
    </span>
  );
}

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const loanId = params.loanId as string;
  const activeTenant = useActiveTenant();

  const loanKey = loanId ? `/api/loans?loan_id=${loanId}` : null;
  const { data: loan, isLoading, error: swrError } = useSWR<LoanDetail>(loanKey, swrFetcher);

  // Registrar pago manual
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState<Exclude<LoanPaymentMethod, "mercadopago">>("efectivo");
  const [payNotes, setPayNotes] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  // Generar link de pago MP
  const [generatingLink, setGeneratingLink] = useState(false);
  const [mpLinkError, setMpLinkError] = useState<string | null>(null);

  // Cancelar préstamo
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  // Cobro automático (suscripción MP)
  const [subscriptionStartDate, setSubscriptionStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [activatingSubscription, setActivatingSubscription] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [subscriptionInitPoint, setSubscriptionInitPoint] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Portal mount
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!loan) return;
    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setPayError("Monto inválido");
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const res = await fetch("/api/loan-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loan.id,
          amount: amountNum,
          payment_method: payMethod,
          notes: payNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setPayError(d.error ?? "Error al registrar pago");
        return;
      }
      setShowPayModal(false);
      setPayAmount("");
      setPayNotes("");
      mutate(loanKey);
    } catch {
      setPayError("Error de red. Intenta de nuevo.");
    } finally {
      setPaying(false);
    }
  }

  async function handleGenerateMpLink() {
    if (!loan || !activeTenant) return;
    setGeneratingLink(true);
    setMpLinkError(null);
    try {
      const res = await fetch("/api/mercadopago/create-loan-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loan.id,
          amount: interestTotal,
          mp_fee_absorbed_by: loan.mp_fee_absorbed_by ?? "customer",
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setMpLinkError(d.error ?? "Error al generar link");
        return;
      }
      const d = await res.json();
      mutate(loanKey);
      window.open(d.payment_link, "_blank");
    } catch {
      setMpLinkError("Error de red al generar link.");
    } finally {
      setGeneratingLink(false);
    }
  }

  async function handleActivateSubscription() {
    if (!loan) return;
    setActivatingSubscription(true);
    setSubscriptionError(null);
    try {
      const res = await fetch("/api/mercadopago/create-loan-subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          loan_id: loan.id,
          start_date: new Date(subscriptionStartDate + "T12:00:00").toISOString(),
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setSubscriptionError(d.error ?? "Error al activar el cobro automático");
        return;
      }
      const d = await res.json();
      setSubscriptionInitPoint(d.init_point);
      mutate(loanKey);
    } catch {
      setSubscriptionError("Error de red. Intenta de nuevo.");
    } finally {
      setActivatingSubscription(false);
    }
  }

  function handleCopyLink(link: string) {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleCancel() {
    if (!loan) return;
    setCancelling(true);
    try {
      await fetch(`/api/loans?loan_id=${loan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      setConfirmCancel(false);
      mutate(loanKey);
    } finally {
      setCancelling(false);
    }
  }

  if (!activeTenant) {
    return <div className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</div>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (swrError || !loan) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        No se pudo cargar el préstamo.
      </div>
    );
  }

  const interest = calcInterestAccrued(loan);
  const interestTotal = parseFloat((loan.amount_pending + interest).toFixed(2));
  const isActive = loan.status === "pending" || loan.status === "partial";
  const overdue = isLoanOverdue(loan);
  const progressPct = loan.amount > 0 ? Math.min(100, (loan.amount_paid / loan.amount) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl w-full space-y-4 pb-56 md:pb-4">
      {/* Header */}
      <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
        <div className="flex items-center gap-3 p-4">
          <button
            type="button"
            onClick={() => router.push(`/dashboard/${tenantSlug}/prestamos`)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-border-soft hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold text-foreground truncate">{loan.concept}</h1>
              <LoanStatusBadge loan={loan} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
              <span className="text-sm font-medium text-foreground">
                {loan.customer?.name ?? "Cliente desconocido"}
              </span>
              {loan.customer?.phone && (
                <a
                  href={`tel:${loan.customer.phone}`}
                  className="text-sm text-accent hover:underline"
                >
                  {loan.customer.phone}
                </a>
              )}
              {loan.customer?.email && (
                <a
                  href={`mailto:${loan.customer.email}`}
                  className="text-sm text-accent hover:underline truncate"
                >
                  {loan.customer.email}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta si vencido */}
      {overdue && isActive && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <p className="text-sm text-red-700">
            Este préstamo venció el{" "}
            {new Date(loan.due_date!).toLocaleDateString("es-MX", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
            .
          </p>
        </div>
      )}

      {/* Resumen de montos */}
      <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-surface p-2.5">
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Total</p>
              <p className="mt-0.5 text-base font-bold text-foreground tabular-nums">{formatMXN(loan.amount)}</p>
            </div>
            <div className="rounded-lg bg-green-50 p-2.5">
              <p className="text-[11px] font-medium text-green-600 uppercase tracking-wide">Pagado</p>
              <p className="mt-0.5 text-base font-bold text-green-700 tabular-nums">{formatMXN(loan.amount_paid)}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${isActive ? "bg-orange-50" : "bg-surface"}`}>
              <p className={`text-[11px] font-medium uppercase tracking-wide ${isActive ? "text-orange-600" : "text-muted-foreground"}`}>Pendiente</p>
              <p className={`mt-0.5 text-base font-bold tabular-nums ${isActive ? "text-orange-700" : "text-muted-foreground"}`}>
                {formatMXN(loan.amount_pending)}
              </p>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted-foreground">{Math.round(progressPct)}% pagado</p>
              {isActive && loan.amount_pending > 0 && (
                <p className="text-[11px] text-muted-foreground">Falta {formatMXN(loan.amount_pending)}</p>
              )}
            </div>
            <div className="h-2.5 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${progressPct >= 100 ? "bg-green-500" : progressPct > 0 ? "bg-green-500" : "bg-border"}`}
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {interest > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" aria-hidden />
              <span>Interés acumulado: +{formatMXN(interest)} · Total a cobrar: <strong>{formatMXN(interestTotal)}</strong></span>
            </div>
          )}
        </div>

        {(loan.due_date || loan.notes) && (
          <div className="border-t border-border px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            {loan.due_date && (
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Fecha límite</p>
                <p className={`mt-0.5 font-medium ${overdue ? "text-red-600" : "text-foreground"}`}>
                  {new Date(loan.due_date).toLocaleDateString("es-MX", {
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              </div>
            )}
            {loan.notes && (
              <div className={loan.due_date ? "" : "sm:col-span-2"}>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Notas</p>
                <p className="mt-0.5 text-foreground">{loan.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Orden vinculada */}
      {loan.order && (
        <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="flex items-center gap-2 border-b border-border px-4 py-3">
            <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <span className="text-sm font-semibold text-foreground">Orden vinculada</span>
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Orden #{loan.order.id.slice(0, 8)}
              </p>
              <p className="text-xs text-muted-foreground">
                {new Date(loan.order.created_at).toLocaleDateString("es-MX", {
                  day: "2-digit", month: "short", year: "numeric",
                })} · {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(loan.order.total)}
              </p>
            </div>
            <a
              href={`/dashboard/${tenantSlug}/ordenes/${loan.order.id}`}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer shrink-0"
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Ver orden
            </a>
          </div>
        </div>
      )}

      {/* Plan de cobro automático */}
      {loan.payment_plan_type && isActive && (() => {
        const isNotSetup = loan.payment_plan_status === "pending_setup" && !loan.mp_preapproval_id && !subscriptionInitPoint;
        const isAwaitingAuth = loan.payment_plan_status === "pending_setup" && (loan.mp_preapproval_id || subscriptionInitPoint);
        const isAutoActive = loan.payment_plan_status === "active";
        const isCardFailed = loan.payment_plan_status === "card_failed";
        const authLink = loan.mp_subscription_init_point ?? subscriptionInitPoint ?? "";

        return (
          <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <CalendarClock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-sm font-semibold text-foreground">Cobro automático</span>
              </div>
              {isAutoActive && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                  <CheckCircle2 className="h-3 w-3" aria-hidden /> Activo
                </span>
              )}
              {isNotSetup && (
                <span className="inline-flex items-center gap-1 rounded-full bg-border-soft px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Sin activar
                </span>
              )}
              {isAwaitingAuth && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <Clock className="h-3 w-3" aria-hidden /> Esperando cliente
                </span>
              )}
              {isCardFailed && (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
                  <XCircle className="h-3 w-3" aria-hidden /> Tarjeta fallida
                </span>
              )}
              {loan.payment_plan_status === "paused" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                  <Clock className="h-3 w-3" aria-hidden /> Pausado
                </span>
              )}
            </div>

            {/* Resumen compacto del plan — siempre visible */}
            <div className="flex items-center gap-4 border-t border-border bg-surface px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                {loan.payment_plan_type === "installments" ? "Cuotas fijas" : "Recurrente"}
              </span>
              {loan.payment_plan_installment_amount && (
                <>
                  <span className="text-border">·</span>
                  <span className="font-medium text-foreground">
                    {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN" }).format(loan.payment_plan_installment_amount)} / cobro
                  </span>
                </>
              )}
              {loan.payment_plan_frequency && (
                <>
                  <span className="text-border">·</span>
                  <span>
                    Cada {loan.payment_plan_frequency} {loan.payment_plan_frequency_type === "weeks" ? "sem." : "mes."}
                  </span>
                </>
              )}
            </div>

            {/* Estado: Sin activar → mostrar acción de activar */}
            {isNotSetup && (
              <div className="p-4 space-y-3">
                {!loan.customer?.email ? (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                    <p className="text-xs text-amber-800">
                      El cliente necesita un email registrado para activar cobros automáticos.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label htmlFor="sub-start-date" className="block text-xs font-medium text-foreground mb-1.5">
                        Primer cobro el
                      </label>
                      <input
                        id="sub-start-date"
                        type="date"
                        value={subscriptionStartDate}
                        onChange={(e) => setSubscriptionStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="min-h-[44px] w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                    </div>
                    {subscriptionError && (
                      <p className="text-xs text-red-600">{subscriptionError}</p>
                    )}
                    <button
                      type="button"
                      onClick={handleActivateSubscription}
                      disabled={activatingSubscription}
                      className={`${btnPrimary} w-full`}
                    >
                      {activatingSubscription
                        ? <><Loader2 className="h-4 w-4 animate-spin" /> Generando link...</>
                        : <><CreditCard className="h-4 w-4" /> Activar cobro automático</>
                      }
                    </button>
                  </>
                )}
              </div>
            )}

            {/* Estado: Esperando autorización del cliente */}
            {isAwaitingAuth && (
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <p className="text-xs text-amber-800">
                    Comparte el link con el cliente para que autorice el cargo y vincule su tarjeta.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleCopyLink(authLink)}
                    className={`${btnPrimary} flex-1`}
                  >
                    {copied
                      ? <><Check className="h-4 w-4" /> ¡Copiado!</>
                      : <><Copy className="h-4 w-4" /> Copiar link</>
                    }
                  </button>
                  <a
                    href={authLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btnSecondary} min-h-[44px] inline-flex items-center justify-center px-3`}
                    aria-label="Abrir link en nueva pestaña"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden />
                  </a>
                </div>
              </div>
            )}

            {/* Estado: Activo */}
            {isAutoActive && (
              <div className="px-4 pb-4 pt-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 px-3 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" aria-hidden />
                  <p className="text-xs text-green-800">
                    Los cobros se realizan automáticamente. El historial se actualiza con cada pago.
                  </p>
                </div>
              </div>
            )}

            {/* Estado: Tarjeta fallida */}
            {isCardFailed && (
              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <p className="text-xs text-red-800">
                    MercadoPago no pudo cobrar. Pide al cliente que actualice su método de pago.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleActivateSubscription}
                  disabled={activatingSubscription}
                  className={`${btnSecondary} w-full`}
                >
                  {activatingSubscription
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Regenerando...</>
                    : <><RefreshCw className="h-4 w-4" /> Generar nuevo link</>
                  }
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* Historial de pagos */}
      <div className="rounded-xl border border-border bg-surface-raised overflow-hidden">
        <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Banknote className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-semibold text-foreground">Historial de pagos</h2>
          </div>
          {loan.payments && loan.payments.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-border-soft px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {loan.payments.length}
            </span>
          )}
        </div>

        {!loan.payments || loan.payments.length === 0 ? (
          <div className="px-4 py-6 text-center">
            <Banknote className="mx-auto h-7 w-7 text-muted-foreground/30 mb-2" aria-hidden />
            <p className="text-sm text-muted-foreground">Sin pagos registrados aún.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {loan.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {LOAN_PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    {(p.source === "mercadopago_webhook" || p.source === "preapproval_webhook") && (
                      <span className="ml-1.5 inline-flex items-center gap-1 rounded-full bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                        <CreditCard className="h-2.5 w-2.5" aria-hidden /> MP
                      </span>
                    )}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{p.notes}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(p.created_at).toLocaleDateString("es-MX", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {p.registered_by_profile?.display_name && (
                      <> · {p.registered_by_profile.display_name}</>
                    )}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-bold text-green-700 tabular-nums">
                  +{formatMXN(p.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones + Cancelar — Desktop only, debajo del historial */}
      {isActive && (
        <div className="hidden md:block rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="flex items-center gap-2 p-4">
            <button
              type="button"
              onClick={() => { setPayAmount(interestTotal.toString()); setShowPayModal(true); }}
              className={`${btnPrimary} flex-1`}
            >
              <Banknote className="h-4 w-4" />
              Registrar pago · {formatMXN(interestTotal)}
            </button>
            <button
              type="button"
              onClick={handleGenerateMpLink}
              disabled={generatingLink}
              className={btnSecondary}
            >
              {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
              Cobrar con MP
            </button>
            {loan.last_payment_link && (
              <a
                href={loan.last_payment_link}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnSecondary} min-h-[44px] inline-flex items-center justify-center px-3`}
                aria-label="Abrir último link"
              >
                <Link2 className="h-4 w-4" aria-hidden />
              </a>
            )}
          </div>
          {mpLinkError && (
            <p className="px-4 pb-3 -mt-1 text-xs text-red-600">{mpLinkError}</p>
          )}

          {/* Cancelar — separado, tono suave hasta confirmar */}
          <div className="border-t border-border px-4 py-3">
            {!confirmCancel ? (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
              >
                <XCircle className="h-4 w-4" aria-hidden />
                Cancelar préstamo
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                  <p className="text-sm text-red-700">
                    ¿Cancelar este préstamo? Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelling}
                    className={btnSecondary}
                  >
                    Volver
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Sí, cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom action bar — Mobile only (portal) */}
      {isActive && mounted && createPortal(
        <div
          className="fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl bg-surface shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
          style={{
            paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
          }}
        >
          {!confirmCancel ? (
            <>
              {/* Acciones principales */}
              <div className="flex gap-2 px-4 pt-4">
                <button
                  type="button"
                  onClick={() => { setPayAmount(interestTotal.toString()); setShowPayModal(true); }}
                  className={`${btnPrimary} flex-1`}
                >
                  <Banknote className="h-4 w-4" />
                  Registrar pago
                </button>
                <button
                  type="button"
                  onClick={handleGenerateMpLink}
                  disabled={generatingLink}
                  className={`${btnSecondary} flex-1`}
                >
                  {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  Cobrar con MP
                </button>
                {loan.last_payment_link && (
                  <a
                    href={loan.last_payment_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${btnSecondary} min-h-[44px] inline-flex items-center justify-center px-3`}
                    aria-label="Abrir último link"
                  >
                    <Link2 className="h-4 w-4" aria-hidden />
                  </a>
                )}
              </div>
              {mpLinkError && (
                <p className="px-4 pt-1.5 text-xs text-red-600">{mpLinkError}</p>
              )}
              {/* Cancelar — separado visualmente */}
              <div className="px-4 pt-2 pb-0">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(true)}
                  className="inline-flex w-full min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <XCircle className="h-4 w-4" aria-hidden />
                  Cancelar préstamo
                </button>
              </div>
            </>
          ) : (
            <div className="px-4 pt-4 space-y-2">
              <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3 py-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden />
                <div>
                  <p className="text-sm font-semibold text-red-800">¿Cancelar este préstamo?</p>
                  <p className="mt-0.5 text-xs text-red-700">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  disabled={cancelling}
                  className={`${btnSecondary} flex-1`}
                >
                  Volver
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex flex-1 min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Sí, cancelar
                </button>
              </div>
            </div>
          )}
        </div>,
        document.body
      )}

      {/* Pago — BottomSheet en mobile */}
      <BottomSheet
        isOpen={showPayModal}
        onClose={() => { setShowPayModal(false); setPayError(null); }}
        title="Registrar pago"
      >
        <p className="text-xs text-muted-foreground mb-4 -mt-1">Pendiente: {formatMXN(interestTotal)}</p>
        <form onSubmit={handleRegisterPayment} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Monto</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                min="0.01"
                max={interestTotal}
                step="0.01"
                required
                autoFocus
                className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface pl-7 pr-3 py-2.5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">Método de pago</label>
            <select
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
              className="select-custom w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-base text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notas <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
            </label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Referencia, comprobante, etc."
              className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-base focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          {payError && <p className="text-sm text-red-600">{payError}</p>}
          <div className="flex flex-col gap-2 pt-1">
            <button type="submit" disabled={paying} className={`${btnPrimary} w-full`}>
              {paying && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirmar pago
            </button>
            <button
              type="button"
              onClick={() => { setShowPayModal(false); setPayError(null); }}
              className={`${btnSecondary} w-full`}
            >
              Cancelar
            </button>
          </div>
        </form>
      </BottomSheet>

      {/* Pago — Dialog centrado en desktop */}
      {showPayModal && (
        <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl">
            <div className="border-b border-border px-5 py-4">
              <h3 className="text-base font-semibold text-foreground">Registrar pago</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Pendiente: {formatMXN(interestTotal)}</p>
            </div>
            <form onSubmit={handleRegisterPayment} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Monto</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    min="0.01"
                    max={interestTotal}
                    step="0.01"
                    required
                    autoFocus
                    className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface pl-7 pr-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">Método de pago</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value as typeof payMethod)}
                  className="select-custom w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Notas <span className="text-xs font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Referencia, comprobante, etc."
                  className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              {payError && <p className="text-sm text-red-600">{payError}</p>}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={paying} className={`${btnPrimary} flex-1`}>
                  {paying && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirmar pago
                </button>
                <button
                  type="button"
                  onClick={() => { setShowPayModal(false); setPayError(null); }}
                  className={btnSecondary}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
