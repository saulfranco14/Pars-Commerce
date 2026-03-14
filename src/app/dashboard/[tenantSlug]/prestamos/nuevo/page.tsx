"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus, Link2, ToggleLeft, ToggleRight, Users, ShoppingCart, FileText, CreditCard, Info, AlertTriangle, Calculator, Check } from "lucide-react";
import { useActiveTenant } from "@/stores/useTenantStore";
import { loanDetailsSchema } from "@/features/prestamos/validations/loanForm";
import { deriveConcept } from "@/features/prestamos/helpers/loanItems";
import { createLoan } from "@/features/prestamos/services/loanService";
import { useLoanItems } from "@/features/prestamos/hooks/useLoanItems";
import { CustomerPicker } from "@/features/prestamos/components/CustomerPicker";
import { LoanItemRow } from "@/features/prestamos/components/LoanItemRow";
import { AddProductCombobox } from "@/features/prestamos/components/AddProductCombobox";
import { FieldError } from "@/features/prestamos/components/FieldError";
import { inputBase, inputError } from "@/features/prestamos/constants/formClasses";
import { CreateEditPageLayout } from "@/components/layout/CreateEditPageLayout";
import { formatMXN } from "@/lib/loanUtils";
import { calcSubscriptionFees, MP_SUB_FEE_PERCENT, MP_SUB_FEE_FIXED_MXN, PARS_SERVICE_FEE_PERCENT } from "@/constants/commissionConfig";
import type { Customer } from "@/types/customers";
import type { PaymentPlanType, MpFeeAbsorbedBy } from "@/types/loans";

export default function NuevoPrestamo() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  // Query params desde una orden vinculada
  const fromOrderId = searchParams.get("order_id") ?? undefined;
  const fromAmount = searchParams.get("amount") ? parseFloat(searchParams.get("amount")!) : undefined;
  const fromConcept = searchParams.get("concept") ?? "";

  const prestamosHref = `/dashboard/${tenantSlug}/prestamos`;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | undefined>();

  const { items, total, handleAddProduct, handleQuantityChange, handleRemove } = useLoanItems();
  const [itemsError, setItemsError] = useState<string | undefined>();

  // Si viene de una orden, concept y monto vienen pre-llenados
  const [concept, setConcept] = useState(fromConcept);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  // Plan de cobro automático
  const [showPaymentPlan, setShowPaymentPlan] = useState(false);
  const [planType, setPlanType] = useState<PaymentPlanType>("installments");
  const [planFrequency, setPlanFrequency] = useState("1");
  const [planFrequencyType, setPlanFrequencyType] = useState<"weeks" | "months">("months");
  const [planInstallmentAmount, setPlanInstallmentAmount] = useState("");
  const [feeAbsorbedBy, setFeeAbsorbedBy] = useState<MpFeeAbsorbedBy>("customer");

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sincronizar concept con fromConcept al montar
  useEffect(() => {
    if (fromConcept && !concept) setConcept(fromConcept);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const derivedConcept = deriveConcept(items, concept);

  // El monto efectivo: si viene de orden es fijo, si no viene de items
  const effectiveTotal = fromOrderId && fromAmount != null ? fromAmount : total;

  function handleAddProductWithReset(product: Parameters<typeof handleAddProduct>[0]) {
    handleAddProduct(product);
    setItemsError(undefined);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setSubmitError(null);
    setCustomerError(undefined);
    setItemsError(undefined);

    let valid = true;

    if (!selectedCustomer) {
      setCustomerError("Selecciona o crea un cliente");
      valid = false;
    }
    // Si viene de una orden el monto está fijo; si no, necesita productos
    if (!fromOrderId && items.length === 0) {
      setItemsError("Agrega al menos un producto al préstamo");
      valid = false;
    }

    const finalConcept = concept.trim() || derivedConcept;
    try {
      await loanDetailsSchema.validate(
        { concept: finalConcept, amount: effectiveTotal, due_date: dueDate, notes },
        { abortEarly: false }
      );
    } catch (err: unknown) {
      valid = false;
      if (err && typeof err === "object" && "inner" in err) {
        const yupErr = err as { inner: { path: string; message: string }[] };
        const map: Partial<Record<string, string>> = {};
        yupErr.inner.forEach((e) => { if (e.path) map[e.path] = e.message; });
        setFieldErrors(map);
      }
    }

    // Validar monto de cobro automático
    if (showPaymentPlan && planInstallmentAmount) {
      const installmentVal = parseFloat(planInstallmentAmount);
      if (isNaN(installmentVal) || installmentVal < 15) {
        setSubmitError("El monto por cobro debe ser al menos $15.00 MXN (mínimo de MercadoPago)");
        valid = false;
      } else if (planType === "installments" && effectiveTotal > 0 && installmentVal > effectiveTotal) {
        setSubmitError("El monto por cobro no puede ser mayor al total de la deuda");
        valid = false;
      }
    }

    if (!valid || !activeTenant?.id || !selectedCustomer) return;

    setLoading(true);
    try {
      const installment = parseFloat(planInstallmentAmount);
      const loan = await createLoan({
        tenant_id: activeTenant.id,
        customer_id: selectedCustomer.id,
        amount: parseFloat(effectiveTotal.toFixed(2)),
        concept: finalConcept,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
        order_id: fromOrderId,
        mp_fee_absorbed_by: showPaymentPlan ? feeAbsorbedBy : undefined,
        ...(showPaymentPlan && planInstallmentAmount && !isNaN(installment) && {
          payment_plan_type: planType,
          payment_plan_frequency: parseInt(planFrequency, 10),
          payment_plan_frequency_type: planFrequencyType,
          payment_plan_installment_amount: installment,
        }),
      });
      router.push(`/dashboard/${tenantSlug}/prestamos/${loan.id}`);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Error de red. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!activeTenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <CreateEditPageLayout
      title="Nuevo préstamo"
      backHref={prestamosHref}
      backLabel="Volver a préstamos"
      description={`Registrar préstamo — ${activeTenant.name}`}
      cancelHref={prestamosHref}
      createLabel="Registrar préstamo"
      createIcon={<Plus className="h-4 w-4 shrink-0" aria-hidden />}
      loading={loading}
      loadingLabel="Registrando..."
      error={submitError}
      onSubmit={handleSubmit}
    >
      <div className="p-4 sm:p-6 flex flex-col gap-5">

        {/* ── Banner: viene de una orden ────────────────────────────────────── */}
        {fromOrderId && (
          <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden />
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">
                Préstamo vinculado a una orden
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                El monto ({formatMXN(fromAmount ?? 0)}) proviene de la orden y no puede modificarse.
              </p>
            </div>
          </div>
        )}

        {/* ── Paso 1: Cliente ──────────────────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0">1</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Cliente</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Busca un cliente existente o crea uno nuevo
                </p>
              </div>
            </div>
            {selectedCustomer && (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 shrink-0">
                Listo
              </span>
            )}
          </div>
          <div className="p-4">
            <CustomerPicker
              activeTenantId={activeTenant.id}
              selected={selectedCustomer}
              onSelect={(c) => { setSelectedCustomer(c); setCustomerError(undefined); }}
              onClear={() => setSelectedCustomer(null)}
              error={customerError}
            />
          </div>
        </section>

        {/* ── Paso 2: Productos (solo si no viene de una orden) ───────────── */}
        {!fromOrderId && (
          <section className="rounded-xl border border-border bg-surface-raised overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0">2</span>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <ShoppingCart className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Productos</h3>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    El total se calcula automáticamente
                  </p>
                </div>
              </div>
              {items.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent tabular-nums shrink-0">
                  {formatMXN(total)}
                </span>
              )}
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Agregar producto del catálogo
                </label>
                <AddProductCombobox activeTenantId={activeTenant.id} onAdd={handleAddProductWithReset} />
              </div>

              {itemsError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                  {itemsError}
                </div>
              )}

              {items.length > 0 ? (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <LoanItemRow
                      key={item.product.id}
                      item={item}
                      index={idx}
                      onQuantityChange={handleQuantityChange}
                      onRemove={handleRemove}
                    />
                  ))}
                  <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3.5 mt-1">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Total del préstamo
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {items.length} producto{items.length !== 1 ? "s" : ""} · {items.reduce((s, i) => s + i.quantity, 0)} unidades
                      </p>
                    </div>
                    <p className="text-xl font-bold text-accent tabular-nums">{formatMXN(total)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-10 gap-2.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-border-soft/50">
                    <ShoppingCart className="h-6 w-6 text-muted-foreground/40" aria-hidden />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-muted-foreground">Sin productos</p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5">
                      Busca y agrega productos del catálogo
                    </p>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Paso 3: Detalles adicionales ───────────────────────────────────── */}
        <section className="rounded-xl border border-border bg-surface-raised overflow-hidden">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-[11px] font-bold text-accent-foreground shrink-0">{fromOrderId ? "2" : "3"}</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Detalles adicionales</h3>
                {!fromOrderId && (
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    El concepto se genera automáticamente de los productos
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="loan-concept" className="block text-sm font-medium text-foreground">
                  Concepto
                </label>
                <input
                  id="loan-concept"
                  type="text"
                  value={concept}
                  onChange={(e) => { setConcept(e.target.value); setFieldErrors((p) => ({ ...p, concept: undefined })); }}
                  placeholder={derivedConcept || "Ej: Arreglo con globos y dulces"}
                  className={fieldErrors.concept ? inputError : inputBase}
                />
                {!concept && derivedConcept && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Se usará: &quot;{derivedConcept.slice(0, 80)}{derivedConcept.length > 80 ? "…" : ""}&quot;
                  </p>
                )}
                <FieldError message={fieldErrors.concept} />
              </div>

              <div>
                <label htmlFor="loan-duedate" className="block text-sm font-medium text-foreground">
                  Fecha límite de pago
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
                </label>
                <input
                  id="loan-duedate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={inputBase}
                />
              </div>

              <div>
                <label htmlFor="loan-notes" className="block text-sm font-medium text-foreground">
                  Notas
                  <span className="ml-1 text-xs font-normal text-muted-foreground">(opcional)</span>
                </label>
                <textarea
                  id="loan-notes"
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setFieldErrors((p) => ({ ...p, notes: undefined })); }}
                  rows={3}
                  placeholder="Acuerdos especiales, detalles, etc."
                  className={`${fieldErrors.notes ? inputError : inputBase} resize-none`}
                />
                <FieldError message={fieldErrors.notes} />
              </div>
            </div>
          </div>
        </section>

        {/* ── Paso 4: Plan de cobro automático con MercadoPago ────────────── */}
        <section className={`rounded-xl border overflow-hidden transition-colors ${showPaymentPlan ? "border-accent/40 bg-accent/2" : "border-border bg-surface-raised"}`}>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3 bg-surface">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shrink-0 ${showPaymentPlan ? "bg-accent text-accent-foreground" : "bg-border-soft text-muted-foreground"}`}>{fromOrderId ? "3" : "4"}</span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div>
                <h3 className="text-sm font-semibold text-foreground">Cobro automático con MercadoPago</h3>
                <p className="text-[11px] text-muted-foreground leading-tight">
                  Cargos recurrentes a la tarjeta del cliente
                  <span className="ml-1">(opcional)</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPaymentPlan((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-accent transition-colors hover:text-accent/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded cursor-pointer"
              aria-pressed={showPaymentPlan}
            >
              {showPaymentPlan
                ? <ToggleRight className="h-5 w-5" aria-hidden />
                : <ToggleLeft className="h-5 w-5 text-muted-foreground" aria-hidden />}
              {showPaymentPlan ? "Activado" : "Activar"}
            </button>
          </div>

          {showPaymentPlan && (() => {
            const MP_MIN_AMOUNT = 15;
            const parsedAmount = parseFloat(planInstallmentAmount) || 0;
            const hasAmount = planInstallmentAmount !== "" && parsedAmount > 0;
            const fees = hasAmount ? calcSubscriptionFees(parsedAmount, feeAbsorbedBy) : null;

            // Validaciones
            const amountTooLow = hasAmount && parsedAmount < MP_MIN_AMOUNT;
            const amountExceedsTotal = hasAmount && planType === "installments" && effectiveTotal > 0 && parsedAmount > effectiveTotal;
            const hasValidationError = amountTooLow || amountExceedsTotal;

            const numPayments = hasAmount && planType === "installments" && effectiveTotal > 0 && !amountExceedsTotal
              ? Math.ceil(effectiveTotal / parsedAmount)
              : null;

            const freqLabel = planFrequency === "1" && planFrequencyType === "months" ? "mes"
              : planFrequency === "1" && planFrequencyType === "weeks" ? "semana"
              : planFrequency === "2" && planFrequencyType === "weeks" ? "quincena"
              : `${planFrequency} ${planFrequencyType === "weeks" ? "semanas" : "meses"}`;

            // Sugerencias inteligentes: dividir deuda en N pagos comunes
            const suggestedSplits = effectiveTotal > 0
              ? [2, 3, 4, 6, 12]
                  .map((n) => ({ n, amount: Math.ceil((effectiveTotal / n) * 100) / 100 }))
                  .filter(({ amount }) => amount >= MP_MIN_AMOUNT && amount <= effectiveTotal)
              : [];

            return (
            <div className="p-4 space-y-5">

              {/* ── 1. ¿Cuánto quieres recibir? ─────────────────────────── */}
              <div>
                <label htmlFor="plan-installment" className="block text-sm font-semibold text-foreground mb-1">
                  ¿Cuánto quieres recibir en cada pago?
                </label>
                <p className="text-[11px] text-muted-foreground mb-2">
                  El monto que recibirás en tu cuenta por cada cobro automático
                </p>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    id="plan-installment"
                    type="number"
                    min={MP_MIN_AMOUNT}
                    max={planType === "installments" ? effectiveTotal || undefined : undefined}
                    step="0.01"
                    value={planInstallmentAmount}
                    onChange={(e) => setPlanInstallmentAmount(e.target.value)}
                    placeholder={effectiveTotal > 0 ? `${MP_MIN_AMOUNT}.00 — ${effectiveTotal.toFixed(2)}` : "0.00"}
                    className={`${hasValidationError ? inputError : inputBase} pl-7 text-lg font-semibold`}
                  />
                </div>

                {/* Validation errors */}
                {amountTooLow && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden />
                    <p className="text-xs text-red-600 font-medium">
                      MercadoPago requiere un mínimo de {formatMXN(MP_MIN_AMOUNT)} por cobro
                    </p>
                  </div>
                )}
                {amountExceedsTotal && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" aria-hidden />
                    <p className="text-xs text-red-600 font-medium">
                      El cobro no puede ser mayor al total de la deuda ({formatMXN(effectiveTotal)})
                    </p>
                  </div>
                )}

                {/* Payments count hint */}
                {numPayments && !hasValidationError && (
                  <p className="mt-1.5 text-xs text-accent font-medium">
                    ≈ {numPayments} cobro{numPayments !== 1 ? "s" : ""} para cubrir {formatMXN(effectiveTotal)}
                  </p>
                )}

                {/* ── Sugerencias rápidas ── */}
                {suggestedSplits.length > 0 && planType === "installments" && (
                  <div className="mt-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Calculator className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                      <span className="text-[11px] font-medium text-muted-foreground">Sugerencias para cubrir {formatMXN(effectiveTotal)}</span>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {suggestedSplits.map(({ n, amount }) => {
                        const isActive = parsedAmount === amount;
                        return (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setPlanInstallmentAmount(amount.toString())}
                            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              isActive
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-surface text-foreground hover:bg-surface-raised hover:border-border-soft"
                            }`}
                          >
                            {isActive && <Check className="h-3 w-3" aria-hidden />}
                            <span className="tabular-nums">{n} pagos</span>
                            <span className="text-muted-foreground">de {formatMXN(amount)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* ── 2. ¿Cada cuánto? (Frecuencia friendly) ──────────────── */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  ¿Cada cuánto se cobra?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { freq: "1", type: "weeks" as const, label: "Semanal" },
                    { freq: "2", type: "weeks" as const, label: "Quincenal" },
                    { freq: "1", type: "months" as const, label: "Mensual" },
                  ]).map(({ freq, type, label }) => {
                    const isSelected = planFrequency === freq && planFrequencyType === type;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => { setPlanFrequency(freq); setPlanFrequencyType(type); }}
                        className={`flex-1 min-h-[44px] rounded-xl border px-3 py-2.5 text-center text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                          isSelected
                            ? "border-accent bg-accent/10 text-accent ring-1 ring-accent/20"
                            : "border-border bg-surface text-foreground hover:bg-surface-raised"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
                <details className="mt-2">
                  <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Personalizar frecuencia
                  </summary>
                  <div className="mt-2 flex gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[11px]">Cada</span>
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={planFrequency}
                        onChange={(e) => setPlanFrequency(e.target.value)}
                        className={`${inputBase} w-24 pl-11 text-center`}
                      />
                    </div>
                    <select
                      value={planFrequencyType}
                      onChange={(e) => setPlanFrequencyType(e.target.value as "weeks" | "months")}
                      className="flex-1 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="weeks">semana(s)</option>
                      <option value="months">mes(es)</option>
                    </select>
                  </div>
                </details>
              </div>

              {/* ── 3. Tipo de plan ──────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  ¿Hasta cuándo se cobra?
                </label>
                <div className="flex gap-2 flex-wrap">
                  {([
                    { value: "installments" as PaymentPlanType, label: "Hasta cubrir la deuda", desc: "Se deja de cobrar al liquidar" },
                    { value: "recurring" as PaymentPlanType, label: "Sin límite", desc: "Cobra hasta cancelar manualmente" },
                  ]).map(({ value, label, desc }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPlanType(value)}
                      className={`flex-1 min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                        planType === value
                          ? "border-accent bg-accent/10 ring-1 ring-accent/20"
                          : "border-border bg-surface hover:bg-surface-raised"
                      }`}
                    >
                      <span className={`block text-sm font-medium ${planType === value ? "text-accent" : "text-foreground"}`}>{label}</span>
                      <span className="block text-[11px] text-muted-foreground mt-0.5">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* ── 4. Comisión ──────────────────────────────────────────── */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Comisión de MercadoPago
                </label>
                <div className="flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setFeeAbsorbedBy("business")}
                    className={`flex-1 min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      feeAbsorbedBy === "business"
                        ? "border-accent bg-accent/10 ring-1 ring-accent/20"
                        : "border-border bg-surface hover:bg-surface-raised"
                    }`}
                  >
                    <span className={`block text-sm font-medium ${feeAbsorbedBy === "business" ? "text-accent" : "text-foreground"}`}>Yo la absorbo</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">Recibo menos por cada cobro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeeAbsorbedBy("customer")}
                    className={`flex-1 min-h-[44px] rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                      feeAbsorbedBy === "customer"
                        ? "border-accent bg-accent/10 ring-1 ring-accent/20"
                        : "border-border bg-surface hover:bg-surface-raised"
                    }`}
                  >
                    <span className={`block text-sm font-medium ${feeAbsorbedBy === "customer" ? "text-accent" : "text-foreground"}`}>El cliente la paga</span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">Se le cobra un poco más al cliente</span>
                  </button>
                </div>
              </div>

              {/* ── 5. Resumen con desglose ──────────────────────────────── */}
              {fees && !hasValidationError && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 overflow-hidden">
                  <div className="px-4 py-3 space-y-3">
                    {/* Línea principal */}
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold text-foreground">
                        {formatMXN(fees.netReceived)} <span className="text-xs font-normal text-muted-foreground">/ {freqLabel}</span>
                      </p>
                      {numPayments && (
                        <span className="text-xs text-muted-foreground">
                          ≈ {numPayments} cobro{numPayments !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    {/* Desglose */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Se cobra al cliente</span>
                        <span className="font-medium text-foreground tabular-nums">{formatMXN(fees.chargeAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Comisión MP <span className="text-[10px]">({(MP_SUB_FEE_PERCENT * 100).toFixed(2)}% + {formatMXN(MP_SUB_FEE_FIXED_MXN)})</span>
                        </span>
                        <span className="font-medium text-red-600 tabular-nums">−{formatMXN(fees.mpFee)}</span>
                      </div>
                      {PARS_SERVICE_FEE_PERCENT > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tarifa de servicio</span>
                          <span className="font-medium text-red-600 tabular-nums">−{formatMXN(fees.parsFee)}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-accent/10 pt-1.5">
                        <span className="font-semibold text-foreground">Recibes por cobro</span>
                        <span className="font-bold text-accent tabular-nums">{formatMXN(fees.netReceived)}</span>
                      </div>
                    </div>

                    {/* Totales */}
                    {numPayments && (
                      <div className="flex justify-between border-t border-accent/10 pt-2 text-xs">
                        <span className="text-muted-foreground">Total estimado a recibir</span>
                        <span className="font-bold text-foreground tabular-nums">{formatMXN(fees.netReceived * numPayments)}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ── 6. Tabla de pagos (amortización visual) ─────────────── */}
              {fees && numPayments && numPayments > 1 && numPayments <= 60 && !hasValidationError && (
                <details className="group">
                  <summary className="flex items-center gap-2 cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Calculator className="h-3.5 w-3.5" aria-hidden />
                    Ver desglose por cobro ({numPayments} pagos)
                    <span className="ml-auto text-[10px] text-muted-foreground group-open:hidden">Expandir</span>
                  </summary>
                  <div className="mt-2 rounded-xl border border-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-surface border-b border-border">
                            <th className="py-2 px-3 text-left font-semibold text-muted-foreground">#</th>
                            <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Cobro</th>
                            <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Recibes</th>
                            <th className="py-2 px-3 text-right font-semibold text-muted-foreground">Saldo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: numPayments }, (_, i) => {
                            const isLast = i === numPayments - 1;
                            const remainingBefore = effectiveTotal - (parsedAmount * i);
                            // Last payment might be less if remainder < installment
                            const thisPayment = isLast ? Math.min(parsedAmount, remainingBefore) : parsedAmount;
                            const thisFees = calcSubscriptionFees(thisPayment, feeAbsorbedBy);
                            const remainingAfter = Math.max(0, remainingBefore - thisPayment);

                            return (
                              <tr
                                key={i}
                                className={`border-b border-border/50 transition-colors ${
                                  isLast ? "bg-green-50/60" : i % 2 === 0 ? "bg-surface-raised" : "bg-surface"
                                }`}
                              >
                                <td className="py-2 px-3 font-medium text-muted-foreground tabular-nums">
                                  {i + 1}
                                </td>
                                <td className="py-2 px-3 text-right tabular-nums text-foreground">
                                  {formatMXN(thisFees.chargeAmount)}
                                </td>
                                <td className="py-2 px-3 text-right tabular-nums text-accent font-medium">
                                  {formatMXN(thisFees.netReceived)}
                                </td>
                                <td className={`py-2 px-3 text-right tabular-nums font-medium ${
                                  remainingAfter === 0 ? "text-green-600" : "text-foreground"
                                }`}>
                                  {remainingAfter === 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Check className="h-3 w-3" aria-hidden />
                                      Liquidado
                                    </span>
                                  ) : (
                                    formatMXN(remainingAfter)
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="bg-accent/5 border-t border-accent/20">
                            <td className="py-2.5 px-3 font-bold text-foreground">Total</td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-bold text-foreground">
                              {formatMXN((() => {
                                let sum = 0;
                                for (let i = 0; i < numPayments; i++) {
                                  const rem = effectiveTotal - (parsedAmount * i);
                                  const p = i === numPayments - 1 ? Math.min(parsedAmount, rem) : parsedAmount;
                                  sum += calcSubscriptionFees(p, feeAbsorbedBy).chargeAmount;
                                }
                                return sum;
                              })())}
                            </td>
                            <td className="py-2.5 px-3 text-right tabular-nums font-bold text-accent">
                              {formatMXN((() => {
                                let sum = 0;
                                for (let i = 0; i < numPayments; i++) {
                                  const rem = effectiveTotal - (parsedAmount * i);
                                  const p = i === numPayments - 1 ? Math.min(parsedAmount, rem) : parsedAmount;
                                  sum += calcSubscriptionFees(p, feeAbsorbedBy).netReceived;
                                }
                                return sum;
                              })())}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-flex items-center gap-1 text-green-600 font-bold text-[10px]">
                                <Check className="h-3 w-3" aria-hidden />
                                {formatMXN(0)}
                              </span>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </details>
              )}

              <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                <div>
                  <p className="text-xs font-medium text-amber-800">El cobro no se activa al crear</p>
                  <p className="mt-0.5 text-[11px] text-amber-700">
                    Una vez registrado, activa el cobro desde el detalle del préstamo. El cliente autoriza el cargo desde un link de MercadoPago.
                  </p>
                </div>
              </div>
            </div>
            );
          })()}
        </section>

      </div>
    </CreateEditPageLayout>
  );
}
