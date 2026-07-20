"use client";

import { useId, useState } from "react";

import { AlertTriangle, CheckCircle2, Mail, UserPlus } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { btnPrimaryFlex, btnSecondary } from "@/components/ui/buttonClasses";
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
 * "Agregar miembro" — homologated onto the schema-driven engine and the
 * FormSheet modal pattern (was previously a full CreateEditPageLayout page).
 * The two post-creation outcomes (email invite sent vs. temp password to
 * hand off manually) render as a success state inside the same sheet instead
 * of replacing the whole page.
 */
export function TeamMemberFormSheet({
  isOpen,
  tenantId,
  onClose,
  onAdded,
}: TeamMemberFormSheetProps) {
  const formId = useId();
  const [result, setResult] = useState<AddMemberResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const fields = buildTeamFields({ tenantId });

  const form = useSchemaForm<TeamFieldValues>(fields, async (values) => {
    const addResult = await addTeamMemberFromForm(tenantId, values);
    setSubmittedEmail(values.email.trim());
    setResult(addResult);
    onAdded();
  });

  function handleClose() {
    form.resetForm();
    setResult(null);
    setCopied(false);
    onClose();
  }

  function handleCopyPassword() {
    if (!result?.tempPassword) return;
    navigator.clipboard.writeText(result.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (result) {
    return (
      <FormSheet
        isOpen={isOpen}
        onClose={handleClose}
        icon={result.invitedByEmail ? Mail : CheckCircle2}
        title={
          result.invitedByEmail ? "Invitación enviada" : "Usuario creado"
        }
        maxWidth="max-w-md"
        footer={
          <button
            type="button"
            onClick={handleClose}
            className={btnPrimaryFlex}
          >
            Cerrar
          </button>
        }
      >
        {result.invitedByEmail ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Supabase ha enviado un correo de invitación a{" "}
              <strong className="text-foreground">{submittedEmail}</strong>.
              La persona debe abrir el enlace del correo y establecer su
              contraseña. Ya está agregada al equipo.
            </p>
            <div className="rounded-lg border border-border-soft bg-surface-raised p-3">
              <p className="text-xs text-muted-foreground">
                Si no llega el correo en unos minutos, revisar carpeta de spam
                o reenviar desde Supabase Dashboard → Authentication → Users.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se ha enviado un correo de confirmación a{" "}
              <strong className="text-foreground">{submittedEmail}</strong>.
              La persona debe confirmar su email antes de poder acceder.
            </p>
            <div className="rounded-lg border border-border-soft bg-surface-raised p-4">
              <p className="mb-2 text-sm font-medium text-foreground">
                Contraseña temporal:
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded border border-border bg-background px-3 py-2 font-mono text-sm text-foreground">
                  {result.tempPassword}
                </code>
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="min-h-[44px] cursor-pointer rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                >
                  {copied ? "✓ Copiado" : "Copiar"}
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="flex items-center gap-2 text-xs font-medium text-yellow-800">
                <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
                Importante:
              </p>
              <ul className="mt-2 space-y-1 text-xs text-yellow-700">
                <li>
                  • Envía esta contraseña a {submittedEmail.split("@")[0]} por
                  WhatsApp o email
                </li>
                <li>
                  • La persona debe confirmar su email (revisar bandeja de
                  entrada/spam)
                </li>
                <li>• Luego puede entrar con el email y esta contraseña temporal</li>
                <li>• Puede cambiar su contraseña desde su perfil</li>
              </ul>
            </div>
          </div>
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
      description="Si el usuario no existe, se le enviará una invitación por correo para que establezca su contraseña."
      footer={
        <div className="flex flex-col gap-2">
          <button
            type="submit"
            form={formId}
            disabled={form.submitting || !form.isValid}
            className={btnPrimaryFlex}
          >
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
