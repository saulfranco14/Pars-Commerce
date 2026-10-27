"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { Phone } from "lucide-react";

import { FormInput } from "@/components/ui/FormInput";
import { FormSheet } from "@/components/ui/FormSheet";
import { adminActionButtonPrimary } from "@/components/admin/actionButtonClasses";

import { leadPhoneSchema } from "@/features/growth/validations/engineSchemas";
import { formatMexicanPhoneInput } from "@/lib/phone";

import type { LeadPhoneSheetProps } from "@/features/growth/interfaces/lead";
import type { LeadPhoneFormValues } from "@/features/growth/validations/engineSchemas";

export function LeadPhoneSheet({ isOpen, currentPhone, busy, onClose, onSubmit }: LeadPhoneSheetProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<LeadPhoneFormValues>({
    resolver: yupResolver(leadPhoneSchema),
    values: { phone: "" },
  });

  const submit = handleSubmit(async ({ phone }) => {
    if (await onSubmit(phone)) {
      reset();
      onClose();
    }
  });

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Corregir teléfono"
      description={currentPhone ? `Hoy tiene ${formatMexicanPhoneInput(currentPhone)}. El nuevo vuelve a la fila de WhatsApp desde cero.` : "El número vuelve a la fila de WhatsApp desde cero."}
      icon={Phone}
      footer={<button type="submit" form="lead-phone-form" disabled={busy} className={`${adminActionButtonPrimary} w-full`}>{busy ? "Guardando…" : "Guardar teléfono"}</button>}
    >
      <form id="lead-phone-form" onSubmit={submit} className="grid gap-4" noValidate>
        <FormInput
          label="Teléfono nuevo"
          type="tel"
          inputMode="tel"
          autoComplete="off"
          placeholder="55 6316 2174"
          hint="Cópialo de su ficha en Google Maps o de su letrero."
          error={errors.phone?.message}
          {...register("phone")}
        />
      </form>
    </FormSheet>
  );
}
