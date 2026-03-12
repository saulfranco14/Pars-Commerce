"use client";

import { useState } from "react";
import { Search, UserPlus, Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { btnPrimary } from "@/components/ui/buttonClasses";
import { FieldError } from "@/features/prestamos/components/FieldError";
import { useCustomerSearch } from "@/features/prestamos/hooks/useCustomerSearch";
import { useNewCustomerForm } from "@/features/prestamos/hooks/useNewCustomerForm";
import { inputBase, inputError } from "@/features/prestamos/constants/formClasses";
import type { CustomerPickerProps } from "@/features/prestamos/interfaces/loanForm";
import type { Customer } from "@/types/customers";

export function CustomerPicker({ activeTenantId, selected, onSelect, onClear, error }: CustomerPickerProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const { search, debouncedSearch, results, handleSearchChange, resetSearch } =
    useCustomerSearch(activeTenantId);

  function handlePick(c: Customer) {
    onSelect(c);
    setSheetOpen(false);
    resetSearch();
    setShowCreate(false);
    resetForm();
  }

  const {
    register,
    handleSubmit,
    errors: newErrors,
    isValid: newIsValid,
    creating,
    createError,
    handleCreate,
    resetForm,
  } = useNewCustomerForm(activeTenantId, handlePick);

  function handleBackToSearch() {
    setShowCreate(false);
    resetForm();
  }

  // ── Search panel ─────────────────────────────────────────────────────────────
  const searchPanel = (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted pointer-events-none" aria-hidden />
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o email..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          autoFocus
          className="input-form w-full min-h-[44px] rounded-xl border border-border bg-surface pl-9 pr-3 py-2.5 text-base placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {results.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          {results.slice(0, 8).map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handlePick(c)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-border-soft/60 active:bg-border-soft transition-colors duration-150 border-b border-border last:border-b-0"
            >
              <div>
                <p className="text-sm font-medium text-foreground">{c.name}</p>
                {c.phone && <p className="text-xs text-muted-foreground">{c.phone}</p>}
              </div>
              <ChevronRight className="h-4 w-4 text-muted shrink-0" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {debouncedSearch.length >= 1 && results.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No se encontró &quot;{debouncedSearch}&quot;.
        </p>
      )}

      <button
        type="button"
        onClick={() => setShowCreate(true)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
      >
        <UserPlus className="h-4 w-4" aria-hidden />
        Crear cliente nuevo
      </button>
    </div>
  );

  // ── Create panel ─────────────────────────────────────────────────────────────
  const createPanel = (
    <form onSubmit={handleSubmit(handleCreate)} noValidate className="space-y-4">
      <button
        type="button"
        onClick={handleBackToSearch}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Volver a búsqueda
      </button>

      <div>
        <label htmlFor="new-customer-name" className="block text-sm font-medium text-foreground">
          Nombre *
        </label>
        <input
          id="new-customer-name"
          type="text"
          {...register("name")}
          placeholder="Nombre completo"
          autoFocus
          className={newErrors.name ? inputError : inputBase}
        />
        <FieldError message={newErrors.name?.message} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="new-customer-phone" className="block text-sm font-medium text-foreground">
            Teléfono *
          </label>
          <input
            id="new-customer-phone"
            type="tel"
            {...register("phone")}
            placeholder="5512345678"
            className={newErrors.phone ? inputError : inputBase}
          />
          <FieldError message={newErrors.phone?.message} />
        </div>
        <div>
          <label htmlFor="new-customer-email" className="block text-sm font-medium text-foreground">
            Email *
          </label>
          <input
            id="new-customer-email"
            type="email"
            {...register("email")}
            placeholder="correo@ejemplo.com"
            className={newErrors.email ? inputError : inputBase}
          />
          <FieldError message={newErrors.email?.message} />
        </div>
      </div>

      {createError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {createError}
        </div>
      )}

      <button
        type="submit"
        disabled={creating || !newIsValid}
        className={`${btnPrimary} w-full`}
      >
        {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Guardar cliente
      </button>
    </form>
  );

  const pickerContent = showCreate ? createPanel : searchPanel;

  // ── Selected customer chip ────────────────────────────────────────────────────
  if (selected) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
          <div>
            <p className="font-medium text-foreground">{selected.name}</p>
            {selected.phone && (
              <p className="text-xs text-muted-foreground">{selected.phone}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClear}
            className="text-sm text-accent hover:underline transition-colors font-medium"
          >
            Cambiar
          </button>
        </div>
        {error && <FieldError message={error} />}
      </div>
    );
  }

  return (
    <div>
      {/* Desktop: inline */}
      <div className="hidden md:block space-y-3">
        {pickerContent}
        {error && <FieldError message={error} />}
      </div>

      {/* Mobile: BottomSheet */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="w-full flex items-center gap-3 min-h-[44px] rounded-xl border border-border bg-surface px-4 py-3 text-base text-muted hover:bg-border-soft transition-colors duration-150 cursor-pointer"
        >
          <Search className="h-4 w-4 shrink-0" aria-hidden />
          Buscar o crear cliente...
        </button>
        {error && <FieldError message={error} />}
        <BottomSheet
          isOpen={sheetOpen}
          onClose={() => { setSheetOpen(false); setShowCreate(false); resetForm(); }}
          title={showCreate ? "Nuevo cliente" : "Seleccionar cliente"}
        >
          {pickerContent}
        </BottomSheet>
      </div>
    </div>
  );
}
