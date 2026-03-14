"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { newCustomerSchema, type NewCustomerValues } from "@/features/prestamos/validations/loanForm";
import { createCustomer } from "@/features/prestamos/services/customerService";
import type { Customer } from "@/types/customers";

export function useNewCustomerForm(
  activeTenantId: string,
  onSuccess: (customer: Customer) => void
) {
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<NewCustomerValues>({
    resolver: yupResolver(newCustomerSchema),
    mode: "onChange",
    defaultValues: { name: "", phone: "", email: "" },
  });

  async function handleCreate(values: NewCustomerValues) {
    setCreateError(null);
    setCreating(true);
    try {
      const customer = await createCustomer(activeTenantId, values);
      reset();
      onSuccess(customer);
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Error al crear cliente");
    } finally {
      setCreating(false);
    }
  }

  function resetForm() {
    reset();
    setCreateError(null);
  }

  return { register, handleSubmit, errors, isValid, creating, createError, handleCreate, resetForm };
}
