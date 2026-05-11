"use client";

import { yupResolver } from "@hookform/resolvers/yup";
import { useForm } from "react-hook-form";

import { paymentAmountSchema } from "@/features/qr/validations/paymentAmountSchema";
import type { PaymentAmountValues } from "@/features/qr/validations/paymentAmountSchema";

interface PaymentAmountFormProps {
  defaultAmount?: number | null;
  onSubmit: (values: PaymentAmountValues) => void | Promise<void>;
  submitting?: boolean;
}

export function PaymentAmountForm({
  defaultAmount,
  onSubmit,
  submitting,
}: PaymentAmountFormProps) {
  const form = useForm<PaymentAmountValues>({
    resolver: yupResolver(paymentAmountSchema),
    defaultValues: {
      customer_name: "",
      customer_email: "",
      amount: defaultAmount ?? undefined,
    },
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
      <input
        className="w-full rounded-lg border border-border px-3 py-2"
        placeholder="Nombre"
        {...form.register("customer_name")}
      />
      <input
        className="w-full rounded-lg border border-border px-3 py-2"
        placeholder="Correo"
        {...form.register("customer_email")}
      />
      <input
        type="number"
        step="0.01"
        className="w-full rounded-lg border border-border px-3 py-2"
        placeholder="Monto"
        {...form.register("amount")}
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full min-h-[44px] rounded-lg bg-accent px-4 py-2 font-medium text-foreground disabled:opacity-50"
      >
        {submitting ? "Generando..." : "Continuar al pago"}
      </button>
    </form>
  );
}
