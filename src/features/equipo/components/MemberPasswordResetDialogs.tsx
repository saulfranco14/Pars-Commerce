"use client";

import { KeyRound, X } from "lucide-react";

import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormSheet } from "@/components/ui/FormSheet";
import { Notification } from "@/components/ui/Notification";
import { btnPrimaryFlex } from "@/components/ui/buttonClasses";
import { StaffCredentialsCard } from "@/features/equipo/components/StaffCredentialsCard";

import type { useMemberPasswordReset } from "@/features/equipo/hooks/useMemberPasswordReset";

export function MemberPasswordResetDialogs({
  reset,
}: {
  reset: ReturnType<typeof useMemberPasswordReset>;
}) {
  const { target, credentials } = reset;
  const name = target?.display_name || target?.email || "";

  return (
    <>
      <ConfirmDialog
        isOpen={Boolean(target) && !credentials && !reset.error}
        onClose={reset.close}
        onConfirm={reset.confirm}
        loading={reset.resetting}
        icon={KeyRound}
        title={`¿Nueva contraseña para ${name}?`}
        description="Su contraseña actual deja de servir. Te damos una temporal para enviársela y al entrar elegirá la suya."
        confirmLabel="Generar contraseña"
      />
      <FormSheet
        isOpen={Boolean(target) && Boolean(credentials || reset.error)}
        onClose={reset.close}
        icon={KeyRound}
        title={credentials ? "Contraseña nueva" : "No se pudo restablecer"}
        maxWidth="max-w-md"
        footer={
          <button type="button" onClick={reset.close} className={btnPrimaryFlex}>
            <X className="h-4 w-4" aria-hidden />
            Cerrar
          </button>
        }
      >
        {credentials && target ? (
          <StaffCredentialsCard credentials={credentials} name={name} email={target.email} />
        ) : (
          <Notification tone="error" message={reset.error} />
        )}
      </FormSheet>
    </>
  );
}
