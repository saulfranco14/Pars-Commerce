"use client";

import { Loader2, UserPlus } from "lucide-react";
import { FieldError } from "@/features/prestamos/components/FieldError";
import { useNewCustomerForm } from "@/features/prestamos/hooks/useNewCustomerForm";
import { inputBase, inputError } from "@/features/prestamos/constants/formClasses";
import type { Customer } from "@/types/customers";

interface NewCustomerModalProps {
  activeTenantId: string;
  onSuccess: (customer: Customer) => void;
  onClose: () => void;
}

export function NewCustomerModal({ activeTenantId, onSuccess, onClose }: NewCustomerModalProps) {
  const {
    register,
    handleSubmit,
    errors,
    isValid,
    creating,
    createError,
    handleCreate,
    resetForm,
  } = useNewCustomerForm(activeTenantId, onSuccess);

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface shadow-xl">
        <div className="flex items-center gap-3 border-b border-border px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/10 shrink-0">
            <UserPlus className="h-4 w-4 text-accent" aria-hidden />
          </div>
          <div>
            <h3 className="text-base font-semibold text-foreground">Nuevo cliente</h3>
            <p className="text-[11px] text-muted-foreground">Completa los datos del cliente</p>
          </div>
        </div>

        <form onSubmit={handleSubmit(handleCreate)} noValidate className="p-4 space-y-4">
          <div>
            <label htmlFor="modal-customer-name" className="block text-sm font-medium text-foreground mb-1.5">
              Nombre *
            </label>
            <input
              id="modal-customer-name"
              type="text"
              {...register("name")}
              placeholder="Nombre completo"
              autoFocus
              className={errors.name ? inputError : inputBase}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div>
            <label htmlFor="modal-customer-phone" className="block text-sm font-medium text-foreground mb-1.5">
              Teléfono *
            </label>
            <input
              id="modal-customer-phone"
              type="tel"
              {...register("phone")}
              placeholder="Ej: 5512345678"
              className={errors.phone ? inputError : inputBase}
            />
            <FieldError message={errors.phone?.message} />
          </div>

          <div>
            <label htmlFor="modal-customer-email" className="block text-sm font-medium text-foreground mb-1.5">
              Email *
            </label>
            <input
              id="modal-customer-email"
              type="email"
              {...register("email")}
              placeholder="correo@ejemplo.com"
              className={errors.email ? inputError : inputBase}
            />
            <FieldError message={errors.email?.message} />
          </div>

          {createError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
              {createError}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={creating || !isValid}
              className="flex-1 min-h-[44px] rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:bg-accent/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {creating && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              Guardar
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="min-h-[44px] rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-foreground hover:bg-border-soft transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
