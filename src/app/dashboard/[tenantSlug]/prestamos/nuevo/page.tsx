"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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

export default function NuevoPrestamo() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenantSlug as string;
  const activeTenant = useActiveTenant();

  const prestamosHref = `/dashboard/${tenantSlug}/prestamos`;

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerError, setCustomerError] = useState<string | undefined>();

  const { items, total, handleAddProduct, handleQuantityChange, handleRemove } = useLoanItems();
  const [itemsError, setItemsError] = useState<string | undefined>();

  const [concept, setConcept] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const derivedConcept = deriveConcept(items, concept);

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
    if (items.length === 0) {
      setItemsError("Agrega al menos un producto al préstamo");
      valid = false;
    }

    const finalConcept = concept.trim() || derivedConcept;
    try {
      await loanDetailsSchema.validate(
        { concept: finalConcept, amount: total, due_date: dueDate, notes },
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
      const loan = await createLoan({
        tenant_id: activeTenant.id,
        customer_id: selectedCustomer.id,
        amount: parseFloat(total.toFixed(2)),
        concept: finalConcept,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined,
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
      description={`Registrar fiado — ${activeTenant.name}`}
      cancelHref={prestamosHref}
      createLabel="Registrar préstamo"
      createIcon={<Plus className="h-4 w-4 shrink-0" aria-hidden />}
      loading={loading}
      loadingLabel="Registrando..."
      error={submitError}
      onSubmit={handleSubmit}
    >
      <div className="p-4 sm:p-6 flex flex-col gap-6">

        {/* ── Cliente ──────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 border-b border-border pb-2">
            <h3 className="text-sm font-semibold text-foreground">Cliente *</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Busca un cliente existente o crea uno nuevo.
            </p>
          </div>
          <CustomerPicker
            activeTenantId={activeTenant.id}
            selected={selectedCustomer}
            onSelect={(c) => { setSelectedCustomer(c); setCustomerError(undefined); }}
            onClear={() => setSelectedCustomer(null)}
            error={customerError}
          />
        </section>

        {/* ── Productos ────────────────────────────────────────────────────── */}
        <section>
          <div className="mb-4 border-b border-border pb-2">
            <h3 className="text-sm font-semibold text-foreground">Productos *</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              El total se calcula automáticamente a partir de los productos.
            </p>
          </div>

          <div className="space-y-4">
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
                <Plus className="h-8 w-8 text-muted-foreground/30" aria-hidden />
                <p className="text-sm text-muted-foreground text-center">
                  Busca y agrega productos<br />para calcular el total
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ── Detalles adicionales ──────────────────────────────────────────── */}
        <section>
          <div className="mb-4 border-b border-border pb-2">
            <h3 className="text-sm font-semibold text-foreground">Detalles adicionales</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              El concepto se genera automáticamente de los productos.
            </p>
          </div>

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
                placeholder={derivedConcept || "Se genera de los productos agregados"}
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
        </section>

      </div>
    </CreateEditPageLayout>
  );
}
