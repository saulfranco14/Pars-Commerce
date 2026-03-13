"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Plus, Link2, ToggleLeft, ToggleRight, Users, ShoppingCart, FileText, CreditCard, Info } from "lucide-react";
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
import type { Customer } from "@/types/customers";
import type { PaymentPlanType } from "@/types/loans";

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
                  <div className="flex items-center justify-between rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 mt-1">
                    <div>
                      <p className="text-sm font-medium text-foreground">Total del préstamo</p>
                      <p className="text-xs text-muted-foreground">
                        {items.length} producto{items.length !== 1 ? "s" : ""} ·{" "}
                        {items.reduce((s, i) => s + i.quantity, 0)} unidades
                      </p>
                    </div>
                    <p className="text-xl font-bold text-accent tabular-nums">{formatMXN(total)}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 gap-2">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground/30" aria-hidden />
                  <p className="text-sm text-muted-foreground text-center">
                    Busca y agrega productos<br />para calcular el total
                  </p>
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

          {showPaymentPlan && (
            <div className="p-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1.5">
                    Tipo de plan
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {([
                      { value: "installments", label: "Cuotas fijas", desc: "Monto fijo hasta cubrir la deuda" },
                      { value: "recurring", label: "Recurrente (sin límite)", desc: "Se cobra indefinidamente" },
                    ] as { value: PaymentPlanType; label: string; desc: string }[]).map(({ value, label, desc }) => (
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

                <div>
                  <label htmlFor="plan-installment" className="block text-sm font-medium text-foreground">
                    Monto por cobro
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                    <input
                      id="plan-installment"
                      type="number"
                      min="1"
                      step="0.01"
                      value={planInstallmentAmount}
                      onChange={(e) => setPlanInstallmentAmount(e.target.value)}
                      placeholder="0.00"
                      className={`${inputBase} pl-7`}
                    />
                  </div>
                  {planType === "installments" && planInstallmentAmount && effectiveTotal > 0 && (
                    <p className="mt-1.5 text-xs text-accent font-medium">
                      ≈ {Math.ceil(effectiveTotal / parseFloat(planInstallmentAmount || "1"))} cobros para cubrir {formatMXN(effectiveTotal)}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Frecuencia
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="12"
                      value={planFrequency}
                      onChange={(e) => setPlanFrequency(e.target.value)}
                      className={`${inputBase} w-20`}
                    />
                    <select
                      value={planFrequencyType}
                      onChange={(e) => setPlanFrequencyType(e.target.value as "weeks" | "months")}
                      className="flex-1 min-h-[44px] rounded-xl border border-border bg-surface px-3 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                    >
                      <option value="weeks">Semana(s)</option>
                      <option value="months">Mes(es)</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Se cobrará cada {planFrequency} {planFrequencyType === "weeks" ? "semana(s)" : "mes(es)"}
                  </p>
                </div>

                {/* Resumen visual del plan */}
                {planInstallmentAmount && parseFloat(planInstallmentAmount) > 0 && effectiveTotal > 0 && (
                  <div className="md:col-span-2 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Info className="h-3.5 w-3.5 text-accent shrink-0" aria-hidden />
                      <p className="text-xs font-semibold text-accent">Resumen del plan</p>
                    </div>
                    <p className="text-sm text-foreground">
                      {formatMXN(parseFloat(planInstallmentAmount))} cada {planFrequency} {planFrequencyType === "weeks" ? "semana(s)" : "mes(es)"}
                      {planType === "installments" && (
                        <> · ≈ {Math.ceil(effectiveTotal / parseFloat(planInstallmentAmount || "1"))} cobros totales</>
                      )}
                    </p>
                  </div>
                )}

                <div className="md:col-span-2 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
                  <div>
                    <p className="text-xs font-medium text-amber-800">El cobro no se activa al crear</p>
                    <p className="mt-0.5 text-[11px] text-amber-700">
                      Una vez registrado el préstamo, podrás activar el cobro automático desde el detalle. El cliente deberá autorizar el cargo desde un link de MercadoPago.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>

      </div>
    </CreateEditPageLayout>
  );
}
