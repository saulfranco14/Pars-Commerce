"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { yupResolver } from "@hookform/resolvers/yup";
import { useForm, type Resolver } from "react-hook-form";
import {
  ArrowRight,
  ChevronDown,
  Coins,
  Gem,
  Heart,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
  ThumbsUp,
  User,
  type LucideIcon,
} from "lucide-react";

import { formatCurrency } from "@/features/qr/helpers/format";

import { CustomerScreenLayout } from "@/features/qr/components/CustomerScreenLayout";
import { paymentAmountSchema } from "@/features/qr/validations/paymentAmountSchema";
import type { PaymentAmountValues } from "@/features/qr/validations/paymentAmountSchema";

interface TipScreenProps {
  tenantName: string;
  qrLabel: string;
  presetAmount: number | null;
  submitting: boolean;
  message: string | null;
  onSubmit: (values: PaymentAmountValues) => void | Promise<void>;
}

interface PresetChip {
  value: number;
  Icon: LucideIcon;
  iconClass: string;
  label: string;
  caption: string;
  highlight?: boolean;
}

function buildPresets(preset: number | null): PresetChip[] {
  if (preset && preset > 0) {
    return [
      {
        value: Math.round(preset * 0.5),
        Icon: ThumbsUp,
        iconClass: "text-amber-500",
        label: formatCurrency(Math.round(preset * 0.5)),
        caption: "Gracias",
      },
      {
        value: preset,
        Icon: Sparkles,
        iconClass: "text-accent",
        label: formatCurrency(preset),
        caption: "Sugerido",
        highlight: true,
      },
      {
        value: Math.round(preset * 1.5),
        Icon: Gem,
        iconClass: "text-violet-500",
        label: formatCurrency(Math.round(preset * 1.5)),
        caption: "Generoso",
      },
    ];
  }
  return [
    {
      value: 20,
      Icon: ThumbsUp,
      iconClass: "text-amber-500",
      label: "$20",
      caption: "Bien",
    },
    {
      value: 50,
      Icon: Sparkles,
      iconClass: "text-accent",
      label: "$50",
      caption: "Excelente",
      highlight: true,
    },
    {
      value: 100,
      Icon: Gem,
      iconClass: "text-violet-500",
      label: "$100",
      caption: "Increíble",
    },
  ];
}

export function TipScreen({
  tenantName,
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

  const hero = (
    <>
      {/* Compact hero illustration */}
      <div className="relative mx-auto flex w-full max-w-xs flex-col items-center lg:max-w-sm">
        {/* Particles */}
        <div className="absolute -top-1 right-6 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-white shadow-md">
          <Sparkles className="h-3 w-3 text-accent" />
        </div>
        <div
          className="absolute -left-1 top-12 flex h-5 w-5 animate-pulse items-center justify-center rounded-full bg-white shadow-md"
          style={{ animationDelay: "300ms" }}
        >
          <Coins className="h-2.5 w-2.5 text-amber-500" />
        </div>

        <div className="relative w-full overflow-hidden rounded-3xl border border-white/20 bg-white/15 px-6 py-6 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-md">
              <Heart
                className="h-7 w-7 text-accent"
                fill="currentColor"
                strokeWidth={0}
              />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight lg:text-3xl">
              {qrLabel}
            </p>
            <p className="mt-1 text-xs font-medium opacity-90 lg:text-sm">
              ¡Gracias por tu visita!
            </p>
          </div>
        </div>
      </div>

      {/* Trust line — only on desktop */}
      <div className="mt-auto hidden gap-2 pt-8 lg:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <ShieldCheck className="h-3.5 w-3.5" />
          Pago seguro
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm">
          <Sparkles className="h-3.5 w-3.5" />
          100% para el equipo
        </span>
      </div>
    </>
  );

  return (
    <CustomerScreenLayout hero={hero} tenantName={tenantName}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              {/* Live amount */}
              <div className="text-center">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  {firstName ? `Tu propina, ${firstName}` : "Tu propina"}
                </p>
                <p className="mt-1 text-5xl font-bold tracking-tight text-foreground lg:text-6xl">
                  {formatCurrency(currentAmount)}
                </p>
              </div>

              {/* Presets */}
              <div>
                <div className="grid grid-cols-3 gap-2">
                  {presets.map((chip) => {
                    const isSelected =
                      !customMode && currentAmount === chip.value;
                    const ChipIcon = chip.Icon;
                    return (
                      <button
                        key={chip.value}
                        type="button"
                        onClick={() => selectPreset(chip.value)}
                        aria-pressed={isSelected}
                        className={`relative flex min-h-[84px] flex-col items-center justify-center gap-1 rounded-2xl border-2 px-2 py-3 text-center transition-all active:scale-[0.96] ${
                          isSelected
                            ? "border-accent bg-gradient-to-br from-accent/15 to-accent/5 shadow-md shadow-accent/15"
                            : "border-border bg-surface hover:border-accent/40 hover:bg-accent/5"
                        }`}
                      >
                        {chip.highlight && (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-accent px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent-foreground shadow">
                            {chip.caption}
                          </span>
                        )}
                        <ChipIcon className={`h-5 w-5 ${chip.iconClass}`} />
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
                  <Sparkles className="h-4 w-4" />
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
                        className="block w-full rounded-2xl border-2 border-border bg-background py-3.5 pl-10 pr-4 text-xl font-bold text-foreground placeholder:text-muted-foreground/30 focus:border-accent focus:outline-none transition-colors"
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

              {/* Optional data — collapsed by default. Both name and email
                  live inside this toggle so a quick anonymous tip only needs
                  amount + CTA. */}
              <div>
                {!showEmail ? (
                  <button
                    type="button"
                    onClick={() => setShowEmail(true)}
                    className="inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-semibold text-muted-foreground hover:text-accent transition-colors"
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
                          className="block w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
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
                          className="block w-full rounded-xl border border-border bg-surface py-2.5 pl-10 pr-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:outline-none transition-colors"
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

              {/* Message */}
              {message && (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm font-medium ${
                    isError
                      ? "border border-red-200 bg-red-50 text-red-700"
                      : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  }`}
                >
                  {message}
                </div>
              )}

              {/* CTA */}
              <button
                type="submit"
                disabled={submitting || currentAmount <= 0}
                className="flex min-h-[56px] w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-accent px-4 py-3 text-base font-bold text-accent-foreground shadow-lg shadow-accent/25 hover:bg-accent/90 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 transition-all"
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

              <p className="text-center text-[11px] text-muted-foreground">
                Pago seguro con Mercado Pago.
              </p>
            </form>
    </CustomerScreenLayout>
  );
}
