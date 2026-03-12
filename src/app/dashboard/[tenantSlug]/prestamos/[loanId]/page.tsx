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
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.push(`/dashboard/${tenantSlug}/prestamos`)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-border-soft hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-foreground truncate">{loan.concept}</h1>
          <p className="text-sm text-muted-foreground">
            {loan.customer?.name ?? "Cliente desconocido"}
          </p>
        </div>
        <LoanStatusBadge loan={loan} />
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
      <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="mt-0.5 text-base font-semibold text-foreground">{formatMXN(loan.amount)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pagado</p>
            <p className="mt-0.5 text-base font-semibold text-green-700">{formatMXN(loan.amount_paid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Pendiente</p>
            <p className={`mt-0.5 text-base font-semibold ${isActive ? "text-orange-700" : "text-muted-foreground"}`}>
              {formatMXN(loan.amount_pending)}
            </p>
          </div>
        </div>

        {/* Barra de progreso */}
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {interest > 0 && (
          <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Interés acumulado: +{formatMXN(interest)} → Total a cobrar: {formatMXN(interestTotal)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm">
          {loan.due_date && (
            <div>
              <p className="text-xs text-muted-foreground">Fecha límite</p>
              <p className={`font-medium ${overdue ? "text-red-600" : "text-foreground"}`}>
                {new Date(loan.due_date).toLocaleDateString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Registrado</p>
            <p className="font-medium text-foreground">
              {new Date(loan.created_at).toLocaleDateString("es-MX", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
          {loan.customer?.phone && (
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <a
                href={`tel:${loan.customer.phone}`}
                className="font-medium text-accent hover:underline"
              >
                {loan.customer.phone}
              </a>
            </div>
          )}
          {loan.notes && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="text-foreground">{loan.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Historial de pagos */}
      <div className="rounded-xl border border-border bg-surface-raised p-4 space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          Historial de pagos
          {loan.payments && loan.payments.length > 0 && (
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              ({loan.payments.length})
            </span>
          )}
        </h2>

        {!loan.payments || loan.payments.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sin pagos registrados aún.</p>
        ) : (
          <div className="space-y-2">
            {loan.payments.map((p) => (
              <div
                key={p.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {LOAN_PAYMENT_METHOD_LABEL[p.payment_method] ?? p.payment_method}
                    {p.source === "mercadopago_webhook" && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(MercadoPago)</span>
                    )}
                  </p>
                  {p.notes && (
                    <p className="text-xs text-muted-foreground truncate">{p.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
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
                <p className="shrink-0 text-sm font-semibold text-green-700">
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
          {/* Cobrar */}
          <div className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
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
                  className={btnSecondary}
                >
                  <Link2 className="h-4 w-4" />
                  Último link
                </a>
              )}
            </div>
          </div>
          {mpLinkError && (
            <p className="px-4 pb-3 text-xs text-red-600">{mpLinkError}</p>
          )}

          {/* Cancelar — separado visualmente con fondo diferente */}
          <div className="border-t border-border bg-surface px-4 py-3">
            {!confirmCancel ? (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className={btnDanger}
              >
                <XCircle className="h-4 w-4" />
                Cancelar préstamo
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                  <p className="text-sm text-red-700">
                    ¿Cancelar este préstamo? Esta acción no se puede deshacer.
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                    Sí, cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelling}
                    className={btnSecondary}
                  >
                    Volver
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
          className="fixed bottom-0 left-0 right-0 z-40 flex flex-col gap-2 rounded-t-2xl bg-surface px-4 pt-4 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] md:hidden"
          style={{
            paddingBottom: "max(1rem, calc(1rem + env(safe-area-inset-bottom)))",
            paddingLeft: "max(1rem, env(safe-area-inset-left, 1rem))",
            paddingRight: "max(1rem, env(safe-area-inset-right, 1rem))",
          }}
        >
          {mpLinkError && (
            <p className="text-xs text-red-600 text-center">{mpLinkError}</p>
          )}
          {!confirmCancel ? (
            <>
              <button
                type="button"
                onClick={() => { setPayAmount(interestTotal.toString()); setShowPayModal(true); }}
                className={`${btnPrimary} w-full`}
              >
                <Banknote className="h-4 w-4" />
                Registrar pago · {formatMXN(interestTotal)}
              </button>
              <button
                type="button"
                onClick={handleGenerateMpLink}
                disabled={generatingLink}
                className={`${btnSecondary} w-full`}
              >
                {generatingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                Cobrar {formatMXN(interestTotal)} con MP
              </button>
              {loan.last_payment_link && (
                <a
                  href={loan.last_payment_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${btnSecondary} w-full`}
                >
                  <Link2 className="h-4 w-4" />
                  Abrir último link
                </a>
              )}
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className={`${btnDanger} w-full`}
              >
                <XCircle className="h-4 w-4" />
                Cancelar préstamo
              </button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <div>
                  <p className="text-sm font-semibold text-red-800">¿Cancelar este préstamo?</p>
                  <p className="mt-0.5 text-xs text-red-700">Esta acción no se puede deshacer.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                disabled={cancelling}
                className="inline-flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Sí, cancelar préstamo
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={cancelling}
                className={`${btnSecondary} w-full`}
              >
                Volver
              </button>
            </>
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
