"use client";

import { useId, useState } from "react";

import { CheckCircle2, UserPlus, X } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
import { StaffCredentialsCard } from "@/features/equipo/components/StaffCredentialsCard";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { buildTeamFields } from "@/features/equipo/validations/teamFieldSchema";
import { addTeamMemberFromForm } from "@/features/equipo/services/teamAdapter";

import type { TeamFieldValues } from "@/features/equipo/validations/teamFieldSchema";
import type { AddMemberResult } from "@/features/equipo/services/teamAdapter";

interface TeamMemberFormSheetProps {
  isOpen: boolean;
  tenantId: string;
  onClose: () => void;
  onAdded: () => void;
}

/**
 * "Agregar miembro". New people get an account right away (no invite email):
 * the sheet then shows the login and one-time password to hand over.
 */
export function TeamMemberFormSheet({
  isOpen,
  tenantId,
  onClose,
  onAdded,
}: TeamMemberFormSheetProps) {
  const formId = useId();
  const [result, setResult] = useState<AddMemberResult | null>(null);
  const [submitted, setSubmitted] = useState({ name: "", email: "" });

  const fields = buildTeamFields({ tenantId });

  const form = useSchemaForm<TeamFieldValues>(fields, async (values) => {
    const addResult = await addTeamMemberFromForm(tenantId, values);
    setSubmitted({ name: values.display_name.trim(), email: values.email?.trim() ?? "" });
    setResult(addResult);
    onAdded();
  });

  function handleClose() {
    form.resetForm();
    setResult(null);
    onClose();
  }

  if (result) {
    return (
      <FormSheet
        isOpen={isOpen}
        onClose={handleClose}
        icon={CheckCircle2}
        title={result.credentials ? "Cuenta lista" : "Agregado al equipo"}
        maxWidth="max-w-md"
        footer={
          <button type="button" onClick={handleClose} className={btnPrimaryFlex}>
            <X className="h-4 w-4" aria-hidden />
            Cerrar
          </button>
        }
      >
        {result.credentials ? (
          <StaffCredentialsCard
            credentials={result.credentials}
            name={submitted.name}
            email={submitted.email}
          />
        ) : (
          <Notification
            tone="success"
            message={`${submitted.name || submitted.email} ya tenía cuenta en Tlaco. Entra con su email y su contraseña de siempre.`}
          />
        )}
      </FormSheet>
    );
  }

  return (
    <FormSheet
      isOpen={isOpen}
      onClose={handleClose}
      icon={UserPlus}
      title="Agregar miembro"
      description="Puede entrar en cuanto la agregues. Te damos una contraseña temporal para enviársela."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {form.submitting ? "Agregando..." : "Agregar"}
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

        {form.submitError && <Notification tone="error" message={form.submitError} />}
      </form>
    </FormSheet>
  );
}
