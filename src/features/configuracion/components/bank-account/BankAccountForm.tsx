"use client";

import { useEffect, useId } from "react";

import { Landmark } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { bankAccountFields } from "@/features/configuracion/validations/bankAccountFieldSchema";

import type { BankAccountFieldValues } from "@/features/configuracion/validations/bankAccountFieldSchema";
import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface BankAccountFormSheetProps {
  isOpen: boolean;
  initial?: TenantPaymentMethod | null;
  onSubmit: (values: BankAccountFieldValues) => Promise<void>;
  onCancel: () => void;
}

/**
 * "Nueva cuenta bancaria" / "Editar cuenta bancaria" — homologated onto the
 * schema-driven engine, same icon-chip FormSheet + fixed footer used by
 * Producto/Servicio/Subcatálogo. The CLABE-duplicate check stays in
 * useBankAccounts (it needs the tenant's existing accounts list, which this
 * component doesn't have) — this component only owns form state.
 */
export function BankAccountFormSheet({
  isOpen,
  initial,
  onSubmit,
  onCancel,
}: BankAccountFormSheetProps) {
  const formId = useId();

  const form = useSchemaForm<BankAccountFieldValues>(
    bankAccountFields,
    async (values) => {
      await onSubmit(values);
    },
  );

  useEffect(() => {
    if (initial) {
      form.reset({
        label: initial.label ?? "",
        bank_name: initial.bank_name ?? "",
        account_holder: initial.account_holder ?? "",
        clabe: initial.clabe ?? "",
        account_number: initial.account_number ?? "",
      } as never);
    } else {
      form.reset({
        label: "",
        bank_name: "",
        account_holder: "",
        clabe: "",
        account_number: "",
      } as never);
    }
    // Only re-sync when the sheet targets a different record — form.reset
    // identity changes every render otherwise.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial]);

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onCancel}
      icon={Landmark}
      title={initial ? "Editar cuenta bancaria" : "Nueva cuenta bancaria"}
      description="Tus clientes podrán transferir directamente a esta cuenta."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
            {form.submitting
              ? "Guardando..."
              : initial
                ? "Guardar cambios"
                : "Agregar cuenta"}
          </button>
          <button type="button" onClick={onCancel} className={btnSecondary}>
            Cancelar
          </button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={form.handleSubmit(form.submit)}
        noValidate
        className="space-y-4"
      >
        <SchemaFormFields
          fields={bankAccountFields}
          register={form.register}
          errors={form.errors}
        />

        {form.submitError && (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            role="alert"
          >
            {form.submitError}
          </div>
        )}
      </form>
    </FormSheet>
  );
}
