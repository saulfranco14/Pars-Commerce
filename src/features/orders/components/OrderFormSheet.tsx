"use client";

import { useId } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { buildOrderFields } from "@/features/orders/validations/orderFieldSchema";
import { create as createOrder } from "@/services/ordersService";

import type { OrderFieldValues } from "@/features/orders/validations/orderFieldSchema";

interface OrderFormSheetProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: string;
  tenantSlug: string;
}

/**
 * "Nueva orden" — same shape as ProductFormSheet: FormSheet + declarative
 * FieldSchema[] + useSchemaForm, instead of the old CreateEditPageLayout
 * page. Creates an empty ticket (customer data optional, editable later
 * from the order detail) and navigates straight there, same as before.
 */
export function OrderFormSheet({
  isOpen,
  onClose,
  tenantId,
  tenantSlug,
}: OrderFormSheetProps) {
  const router = useRouter();
  const formId = useId();

  const fields = buildOrderFields(tenantId);

  const form = useSchemaForm<OrderFieldValues>(fields, async (values) => {
    const data = (await createOrder({
      tenant_id: tenantId,
      customer_name: values.customer_name?.trim() || undefined,
      customer_email: values.customer_email?.trim() || undefined,
      customer_phone: values.customer_phone?.trim() || undefined,
      assigned_to: values.assigned_to || undefined,
    })) as { id: string };
    onClose();
    router.push(`/dashboard/${tenantSlug}/ordenes/${data.id}`);
    router.refresh();
  });

  function handleClose() {
    form.resetForm();
    onClose();
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={handleClose}
      icon={ClipboardList}
      title="Nueva orden"
      description="Crea un ticket. Podrás agregar productos y cliente después."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
            {form.submitting ? "Creando..." : "Crear orden"}
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
          fields={fields}
          register={form.register}
          errors={form.errors}
          watch={form.watch}
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
