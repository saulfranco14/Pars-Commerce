"use client";

import { UseFormRegister, FieldErrors } from "react-hook-form";
import { FieldError } from "@/features/prestamos/components/FieldError";
import { inputBase, inputError } from "@/features/prestamos/constants/formClasses";

export interface CustomerFieldValues {
  name: string;
  email: string;
  phone: string;
}

/** Accepts both required (newCustomerSchema) and optional (orderCustomerSchema) field types */
type CompatibleFields = { name?: string; email?: string; phone?: string };

interface CustomerFieldsProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: UseFormRegister<any>;
  errors: FieldErrors<CompatibleFields>;
  /** Compact: 3-col grid, smaller inputs (used in order CustomerCard) */
  compact?: boolean;
  idPrefix?: string;
  disabled?: boolean;
}

export function CustomerFields({
  register,
  errors,
  compact = false,
  idPrefix = "customer",
  disabled = false,
}: CustomerFieldsProps) {
  const baseClass = compact
    ? inputBase.replace("min-h-[44px]", "min-h-[38px]").replace("text-base", "text-sm")
    : inputBase;
  const errClass = compact
    ? inputError.replace("min-h-[44px]", "min-h-[38px]").replace("text-base", "text-sm")
    : inputError;

  const labelClass = compact
    ? "block text-[10px] font-bold text-muted uppercase tracking-wider"
    : "block text-sm font-medium text-foreground";

  const nameField = (
    <div>
      <label htmlFor={`${idPrefix}-name`} className={labelClass}>
        Nombre{!compact && " *"}
      </label>
      <input
        id={`${idPrefix}-name`}
        type="text"
        {...register("name")}
        placeholder="Nombre completo"
        disabled={disabled}
        className={errors.name ? errClass : baseClass}
      />
      <FieldError message={errors.name?.message} />
    </div>
  );

  const emailField = (
    <div>
      <label htmlFor={`${idPrefix}-email`} className={labelClass}>
        Email{!compact && " *"}
      </label>
      <input
        id={`${idPrefix}-email`}
        type="email"
        {...register("email")}
        placeholder="correo@ejemplo.com"
        disabled={disabled}
        className={errors.email ? errClass : baseClass}
      />
      <FieldError message={errors.email?.message} />
    </div>
  );

  const phoneField = (
    <div>
      <label htmlFor={`${idPrefix}-phone`} className={labelClass}>
        Teléfono{!compact && " *"}
      </label>
      <input
        id={`${idPrefix}-phone`}
        type="tel"
        {...register("phone")}
        placeholder="Ej: 5512345678"
        disabled={disabled}
        className={errors.phone ? errClass : baseClass}
      />
      <FieldError message={errors.phone?.message} />
    </div>
  );

  if (compact) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {nameField}
        {emailField}
        {phoneField}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {nameField}
      <div className="grid grid-cols-2 gap-3">
        {phoneField}
        {emailField}
      </div>
    </div>
  );
}
