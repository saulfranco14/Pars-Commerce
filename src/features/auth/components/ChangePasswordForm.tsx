"use client";

import { KeyRound, Loader2 } from "lucide-react";

import { useChangePassword } from "@/features/auth/hooks/useChangePassword";
import { Notification } from "@/components/ui/Notification";
import { PasswordInput } from "@/components/ui/PasswordInput";

export function ChangePasswordForm({
  submitLabel = "Guardar contraseña",
  onDone,
}: {
  submitLabel?: string;
  onDone?: () => void;
}) {
  const form = useChangePassword(onDone);

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void form.submit();
      }}
    >
      <div>
        <PasswordInput
          id="new-password"
          label="Nueva contraseña"
          autoComplete="new-password"
          value={form.values.newPassword}
          onChange={(event) => form.setField("newPassword", event.target.value)}
        />
        {form.fieldErrors.newPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{form.fieldErrors.newPassword}</p>
        )}
      </div>
      <div>
        <PasswordInput
          id="confirm-password"
          label="Confírmala"
          autoComplete="new-password"
          value={form.values.confirmPassword}
          onChange={(event) => form.setField("confirmPassword", event.target.value)}
        />
        {form.fieldErrors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{form.fieldErrors.confirmPassword}</p>
        )}
      </div>

      {form.error && <Notification tone="error" message={form.error} />}
      {form.saved && <Notification tone="success" message="Listo, tu contraseña quedó guardada." />}

      <button
        type="submit"
        disabled={form.submitting}
        className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        {form.submitting ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <KeyRound className="h-4 w-4" aria-hidden />
        )}
        {form.submitting ? "Guardando…" : submitLabel}
      </button>
    </form>
  );
}
