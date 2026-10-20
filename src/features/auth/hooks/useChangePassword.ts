"use client";

import { useState } from "react";
import { ValidationError } from "yup";

import { createClient } from "@/lib/supabase/client";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { useSessionStore } from "@/stores/useSessionStore";
import { setPasswordSchema } from "@/features/auth/validations/setPasswordForm";

import type { SetPasswordValues } from "@/features/auth/validations/setPasswordForm";

/** Sets a new password for the logged-in user and clears the one-time-password flag. */
export function useChangePassword(onDone?: () => void) {
  const setMustChangePassword = useSessionStore((s) => s.setMustChangePassword);
  const [values, setValues] = useState<SetPasswordValues>({ newPassword: "", confirmPassword: "" });
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SetPasswordValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function setField(name: keyof SetPasswordValues, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setSaved(false);
  }

  async function submit() {
    setError(null);
    try {
      await setPasswordSchema.validate(values, { abortEarly: false });
    } catch (err) {
      if (err instanceof ValidationError) {
        setFieldErrors(
          Object.fromEntries(err.inner.map((e) => [e.path, e.message])) as typeof fieldErrors,
        );
      }
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await createClient().auth.updateUser({
      password: values.newPassword,
      data: { must_change_password: false },
    });
    setSubmitting(false);
    if (updateError) {
      setError(resolveUserError(updateError, "supabase"));
      return;
    }
    setValues({ newPassword: "", confirmPassword: "" });
    setSaved(true);
    setMustChangePassword(false);
    onDone?.();
  }

  return { values, fieldErrors, submitting, error, saved, setField, submit };
}
