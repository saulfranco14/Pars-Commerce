"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { bankAccountSchema } from "@/features/configuracion/validations/bankAccountSchema";
import { inputClass, labelClass } from "@/features/configuracion/constants/formClasses";

import type { BankAccountFormValues } from "@/features/configuracion/validations/bankAccountSchema";
import type { TenantPaymentMethod } from "@/features/configuracion/interfaces/bankAccount";

interface BankAccountFormProps {
  initial?: TenantPaymentMethod | null;
  onSubmit: (values: BankAccountFormValues) => Promise<void>;
  onCancel: () => void;
  submitting: boolean;
  error?: string | null;
}

export function BankAccountForm({
  initial,
  onSubmit,
  onCancel,
  submitting,
  error,
}: BankAccountFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BankAccountFormValues>({
    resolver: yupResolver(bankAccountSchema),
    defaultValues: {
      label: "",
      bank_name: "",
      account_holder: "",
      clabe: "",
      account_number: null,
    },
  });

  useEffect(() => {
    if (initial) {
      reset({
        label: initial.label ?? "",
        bank_name: initial.bank_name ?? "",
        account_holder: initial.account_holder ?? "",
        clabe: initial.clabe ?? "",
        account_number: initial.account_number ?? null,
      });
    } else {
      reset({ label: "", bank_name: "", account_holder: "", clabe: "", account_number: null });
    }
  }, [initial, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="label" className={labelClass}>
          Nombre de la cuenta
        </label>
        <input
          id="label"
          type="text"
          placeholder="Ej. Cuenta principal BBVA"
          className={inputClass}
          {...register("label")}
        />
        {errors.label && (
          <p className="mt-1 text-xs text-red-600">{errors.label.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="bank_name" className={labelClass}>
          Banco
        </label>
        <input
          id="bank_name"
          type="text"
          placeholder="Ej. BBVA, Banorte, HSBC"
          className={inputClass}
          {...register("bank_name")}
        />
        {errors.bank_name && (
          <p className="mt-1 text-xs text-red-600">{errors.bank_name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="account_holder" className={labelClass}>
          Titular de la cuenta
        </label>
        <input
          id="account_holder"
          type="text"
          placeholder="Nombre completo del titular"
          className={inputClass}
          {...register("account_holder")}
        />
        {errors.account_holder && (
          <p className="mt-1 text-xs text-red-600">{errors.account_holder.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="clabe" className={labelClass}>
          CLABE interbancaria
        </label>
        <input
          id="clabe"
          type="text"
          placeholder="18 dígitos"
          maxLength={18}
          inputMode="numeric"
          className={inputClass}
          {...register("clabe")}
        />
        {errors.clabe && (
          <p className="mt-1 text-xs text-red-600">{errors.clabe.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="account_number" className={labelClass}>
          Número de cuenta{" "}
          <span className="text-muted-foreground font-normal">(opcional)</span>
        </label>
        <input
          id="account_number"
          type="text"
          placeholder="Ej. 1234567890"
          className={inputClass}
          {...register("account_number")}
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] cursor-pointer rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-border-soft/40"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="min-h-[44px] cursor-pointer rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Guardando..." : initial ? "Guardar cambios" : "Agregar cuenta"}
        </button>
      </div>
    </form>
  );
}
