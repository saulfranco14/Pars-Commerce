"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, type Resolver } from "react-hook-form";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  Loader2,
  Mail,
  Plus,
  User,
} from "lucide-react";

import { Notification } from "@/components/ui/Notification";
import { formatCurrency, getInitials } from "@/features/qr/helpers/format";

import { CustomerScreen } from "@/features/qr/components/CustomerScreen";
import { paymentAmountSchema } from "@/features/qr/validations/paymentAmountSchema";
import type { PaymentAmountValues } from "@/features/qr/validations/paymentAmountSchema";

interface TipScreenProps {
  tenantName: string;
  tenantLogoUrl?: string | null;
  qrLabel: string;
  presetAmount: number | null;
  submitting: boolean;
  message: string | null;
  onSubmit: (values: PaymentAmountValues) => void | Promise<void>;
}

interface PresetChip {
  value: number;
  label: string;
  caption: string;
  highlight?: boolean;
}

function buildPresets(preset: number | null): PresetChip[] {
  if (preset && preset > 0) {
    return [
      {
        value: Math.round(preset * 0.5),
        label: formatCurrency(Math.round(preset * 0.5)),
        caption: "Gracias",
      },
      {
        value: preset,
        label: formatCurrency(preset),
        caption: "Sugerido",
        highlight: true,
      },
      {
        value: Math.round(preset * 1.5),
        label: formatCurrency(Math.round(preset * 1.5)),
        caption: "Generoso",
      },
    ];
  }
  return [
    { value: 20, label: "$20", caption: "Bien" },
    { value: 50, label: "$50", caption: "Excelente", highlight: true },
    { value: 100, label: "$100", caption: "Increíble" },
  ];
}

export function TipScreen({
  tenantName,
  tenantLogoUrl,
  qrLabel,
  presetAmount,
  submitting,
  message,
  onSubmit,
}: TipScreenProps) {
  const presets = useMemo(() => buildPresets(presetAmount), [presetAmount]);

  const form = useForm<PaymentAmountValues>({
    resolver: yupResolver(
      paymentAmountSchema,
    ) as unknown as Resolver<PaymentAmountValues>,
    defaultValues: {
      customer_name: "",
      customer_email: "",
      amount: presets.find((p) => p.highlight)?.value ?? presets[0]?.value ?? 0,
    },
  });

  const rawAmount = form.watch("amount");
  const currentAmount =
    typeof rawAmount === "number" && !Number.isNaN(rawAmount) ? rawAmount : 0;
  const customerName = form.watch("customer_name");
  const [customMode, setCustomMode] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const customRef = useRef<HTMLInputElement | null>(null);
  const amountRegister = form.register("amount", { valueAsNumber: true });

  useEffect(() => {
    if (customMode) customRef.current?.focus();
  }, [customMode]);

  const errors = form.formState.errors;
  const isError = message && /error|no se pudo|inválido|invalid/i.test(message);
  const firstName = customerName?.trim().split(" ")[0];

  function selectPreset(value: number) {
    form.setValue("amount", value, { shouldValidate: true });
    setCustomMode(false);
  }

  const header = (
    <div className="flex items-center gap-3">
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/90 p-1">
        {tenantLogoUrl ? (
          <Image
            src={tenantLogoUrl}
            alt={tenantName}
            fill
            sizes="44px"
            className="object-contain"
          />
        ) : (
          <span className="text-base font-bold uppercase tracking-tight text-accent">
            {getInitials(tenantName?.trim() || qrLabel)}
          </span>
        )}
      </span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-75">
          {tenantName}
        </p>
        <p className="flex items-center gap-1.5 truncate text-lg font-bold tracking-tight">
          <Heart className="h-4 w-4" fill="currentColor" strokeWidth={0} />
          {qrLabel}
        </p>
      </div>
    </div>
  );

  return (
    <CustomerScreen
      tenantName={tenantName}
      header={header}
      footer={
        <button
          type="submit"
          form="tip-form"
          disabled={submitting || currentAmount <= 0}
          className="flex min-h-[54px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 text-base font-bold text-accent-foreground shadow-md shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Generando pago...
            </>
          ) : (
            <>
              Continuar · {formatCurrency(currentAmount)}
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      }
    >
      <form id="tip-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Live amount */}
        <div className="text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            {firstName ? `Tu propina, ${firstName}` : "Tu propina"}
          </p>
          <p className="mt-1 text-5xl font-bold tracking-tight text-foreground">
            {formatCurrency(currentAmount)}
          </p>
        </div>

        {/* Presets */}
        <div>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((chip) => {
              const isSelected = !customMode && currentAmount === chip.value;
              return (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => selectPreset(chip.value)}
                  aria-pressed={isSelected}
                  className={`relative flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all active:scale-[0.96] ${
                    isSelected
                      ? "border-accent bg-accent/5 shadow-md shadow-accent/15"
                      : "border-border bg-surface hover:border-accent/40"
                  }`}
                >
                  {chip.highlight && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground shadow">
                      {chip.caption}
                    </span>
                  )}
                  <span className="text-base font-bold text-foreground">
                    {chip.label}
                  </span>
                  {!chip.highlight && (
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {chip.caption}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom toggle */}
          <button
            type="button"
            onClick={() => {
              setCustomMode(true);
              form.setValue("amount", 0, { shouldValidate: false });
            }}
            className={`mt-2.5 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-2.5 text-sm font-semibold transition-colors ${
              customMode
                ? "border-accent bg-accent/5 text-accent"
                : "border-border text-muted-foreground hover:border-accent/40 hover:text-accent"
            }`}
          >
            <Plus className="h-4 w-4" />
            Otro monto
          </button>

          {customMode && (
            <label className="mt-2.5 block">
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-muted-foreground">
                  $
                </span>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  min={1}
                  placeholder="0"
                  {...amountRegister}
                  ref={(el) => {
                    amountRegister.ref(el);
                    customRef.current = el;
                  }}
                  className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-10 pr-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 transition-colors focus:border-accent focus:outline-none"
                />
              </div>
            </label>
          )}

          {errors.amount && (
            <p className="mt-1.5 text-center text-xs font-medium text-red-600">
              {errors.amount.message}
            </p>
          )}
        </div>

        {/* Optional data — collapsed by default. */}
        <div>
          {!showEmail ? (
            <button
              type="button"
              onClick={() => setShowEmail(true)}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-accent"
            >
              <Mail className="h-3.5 w-3.5" />
              Agregar mi nombre y comprobante por correo
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
          ) : (
            <div className="space-y-2.5 rounded-2xl border border-border bg-background/40 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Tus datos{" "}
                <span className="font-medium normal-case text-muted-foreground/60">
                  (opcional)
                </span>
              </p>
              <label className="block">
                <div className="relative">
                  <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder="Tu nombre"
                    {...form.register("customer_name")}
                    className="block w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-accent focus:outline-none"
                  />
                </div>
                {errors.customer_name && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.customer_name.message}
                  </p>
                )}
              </label>
              <label className="block">
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    autoComplete="email"
                    placeholder="Correo (para comprobante)"
                    {...form.register("customer_email")}
                    className="block w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 transition-colors focus:border-accent focus:outline-none"
                  />
                </div>
                {errors.customer_email && (
                  <p className="mt-1 text-xs font-medium text-red-600">
                    {errors.customer_email.message}
                  </p>
                )}
              </label>
            </div>
          )}
        </div>

        {message && (
          <Notification tone={isError ? "error" : "success"} message={message} />
        )}

        <p className="text-center text-[11px] text-muted-foreground">
          Pago seguro con Mercado Pago.
        </p>
      </form>
    </CustomerScreen>
  );
}
