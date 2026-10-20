"use client";

import { KeyRound, Loader2, X } from "lucide-react";

import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { btnWorkPrimary, btnWorkSecondary } from "@/components/ui/buttonClasses";
import { StaffCredentialsCard } from "@/features/equipo/components/StaffCredentialsCard";
import { StaffPasswordInput } from "@/features/equipo/components/StaffPasswordInput";

import type { useMemberPasswordChange } from "@/features/equipo/hooks/useMemberPasswordChange";

export function MemberPasswordSheet({ sheet }: { sheet: ReturnType<typeof useMemberPasswordChange> }) {
  const name = sheet.target?.display_name || sheet.target?.email || "";

  return (
    <FormSheet
      isOpen={Boolean(sheet.target)}
      onClose={sheet.close}
      icon={KeyRound}
      title={sheet.credentials ? "Contraseña lista" : `Contraseña de ${name}`}
      description={sheet.credentials ? undefined : "La que tenía deja de servir en cuanto guardes."}
      maxWidth="max-w-md"
      dismissible={!sheet.saving}
      footer={
        sheet.credentials ? (
          <button type="button" onClick={sheet.close} className={`${btnWorkSecondary} w-full`}>
            <X className="h-4 w-4" aria-hidden />
            Cerrar
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <button type="submit" form="member-password-form" disabled={sheet.saving} className={`${btnWorkPrimary} w-full`}>
              {sheet.saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <KeyRound className="h-4 w-4" aria-hidden />}
              {sheet.saving ? "Guardando…" : "Guardar contraseña"}
            </button>
            <button type="button" onClick={sheet.close} className={`${btnWorkSecondary} w-full`}>
              Cancelar
            </button>
          </div>
        )
      }
    >
      {sheet.credentials ? (
        <StaffCredentialsCard credentials={sheet.credentials} name={name} />
      ) : (
        <form
          id="member-password-form"
          noValidate
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void sheet.save();
          }}
        >
          <StaffPasswordInput id="member-password" value={sheet.password} onChange={sheet.change} error={sheet.fieldError} />
          {sheet.error && <Notification tone="error" message={sheet.error} />}
        </form>
      )}
    </FormSheet>
  );
}
