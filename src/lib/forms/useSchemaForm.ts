"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import {
  buildDefaultValues,
  buildYupSchema,
  type CrossFieldRule,
  type FieldSchema,
} from "@/lib/forms/fieldSchema";

import type { FieldValues } from "react-hook-form";

/**
 * Generic create-form hook driven by a FieldSchema[] declaration. Mirrors the
 * shape of useNewCustomerForm.ts (RHF + yupResolver, mode:"onChange",
 * isValid-gated submit) so every schema-driven form behaves identically.
 *
 * `onSubmit` is the caller's actual API call (create/update) — this hook only
 * owns form state, validation, and the submitting/error bookkeeping around it.
 * `crossFieldRules` folds multi-field validation (e.g. "both or neither")
 * into the same Yup schema instead of manual if-chains in the caller.
 */
export function useSchemaForm<T extends FieldValues>(
  fields: FieldSchema[],
  onSubmit: (values: T) => Promise<void>,
  crossFieldRules: CrossFieldRule[] = [],
) {
  const schema = useMemo(
    () => buildYupSchema(fields, crossFieldRules),
    [fields, crossFieldRules],
  );
  const defaultValues = useMemo(() => buildDefaultValues(fields), [fields]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isValid },
  } = useForm<T>({
    resolver: yupResolver(schema) as never,
    mode: "onChange",
    defaultValues: defaultValues as never,
  });

  async function submit(values: T) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      await onSubmit(values);
      reset();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado",
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    reset();
    setSubmitError(null);
  }

  return {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    errors,
    isValid,
    submitting,
    submitError,
    submit,
    resetForm,
  };
}
