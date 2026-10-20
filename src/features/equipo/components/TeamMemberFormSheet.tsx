"use client";

import { useId, useMemo, useState } from "react";

import { CheckCircle2, UserPlus, X } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { btnWorkPrimary, btnWorkSecondary } from "@/components/ui/buttonClasses";
import { StaffCredentialsCard } from "@/features/equipo/components/StaffCredentialsCard";
import { useSchemaForm } from "@/lib/forms/useSchemaForm";
import { SchemaFormFields } from "@/lib/forms/SchemaFormFields";
import { buildTeamFields, TEAM_CROSS_FIELD_RULES } from "@/features/equipo/validations/teamFieldSchema";
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
 * "Agregar miembro". The owner sets the password and the account works right
 * away (no invite email); the sheet then shows what to hand over.
 */
export function TeamMemberFormSheet({
  isOpen,
  tenantId,
  onClose,
  onAdded,
}: TeamMemberFormSheetProps) {
  const formId = useId();
  const [result, setResult] = useState<AddMemberResult | null>(null);
  const [submittedName, setSubmittedName] = useState("");

  const fields = useMemo(() => buildTeamFields({ tenantId }), [tenantId]);

  const form = useSchemaForm<TeamFieldValues>(
    fields,
    async (values) => {
      const addResult = await addTeamMemberFromForm(tenantId, values);
      setSubmittedName(values.display_name.trim());
      setResult(addResult);
      onAdded();
    },
    TEAM_CROSS_FIELD_RULES,
  );

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
          <button type="button" onClick={handleClose} className={`${btnWorkSecondary} w-full`}>
            <X className="h-4 w-4" aria-hidden />
            Cerrar
          </button>
        }
      >
        {result.credentials ? (
          <StaffCredentialsCard credentials={result.credentials} name={submittedName} />
        ) : (
          <Notification
            tone="success"
            message={`${submittedName} ya tenía cuenta en Tlaco. Entra con su email y su contraseña de siempre.`}
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
      description="Tú le pones la contraseña y entra en cuanto la agregues."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={`${btnWorkPrimary} w-full`}
          >
            <UserPlus className="h-4 w-4" aria-hidden />
            {form.submitting ? "Agregando..." : "Agregar"}
          </button>
          <button type="button" onClick={handleClose} className={`${btnWorkSecondary} w-full`}>
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
          setValue={form.setValue}
          control={form.control}
        />

        {form.submitError && <Notification tone="error" message={form.submitError} />}
      </form>
    </FormSheet>
  );
}
