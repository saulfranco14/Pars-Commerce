"use client";

import { useId } from "react";

import { UserPlus } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { createCustomer } from "@/features/prestamos/services/customerService";
import {
  newCustomerFields,
  type NewCustomerFieldValues,
} from "@/features/prestamos/validations/newCustomerFieldSchema";

import type { Customer } from "@/types/customers";

interface NewCustomerModalProps {
  activeTenantId: string;
  onSuccess: (customer: Customer) => void;
  onClose: () => void;
}

/**
 * "Nuevo cliente" — the reference create-record sheet. Now built on the same
 * schema-driven engine (FieldSchema + useSchemaForm + SchemaFormFields) as
 * every other homologated create form, inside the shared FormSheet with its
 * icon-chip header — instead of the bespoke hand-rolled modal this used to be.
 */
export function NewCustomerModal({
  activeTenantId,
  onSuccess,
  onClose,
}: NewCustomerModalProps) {
  const formId = useId();
  const form = useSchemaForm<NewCustomerFieldValues>(
    newCustomerFields,
    async (values) => {
      const customer = await createCustomer(activeTenantId, values);
      onSuccess(customer);
    },
  );

  function handleClose() {
    form.resetForm();
    onClose();
  }

  return (
    <FormSheet
      isOpen
      onClose={handleClose}
      icon={UserPlus}
      title="Nuevo cliente"
      description="Completa los datos del cliente"
      maxWidth="max-w-md"
      footer={
        <div className="flex gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
            {form.submitting ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={handleClose} className={btnSecondary}>
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
          fields={newCustomerFields}
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
