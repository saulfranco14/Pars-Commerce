"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Package,
  Trash2,
  Minus,
  Plus,
  CreditCard,
  Repeat,
  SplitSquareHorizontal,
  ArrowLeft,
  BadgeCheck,
  ShieldCheck,
  Sparkles,
  X,
  Lock,
} from "lucide-react";
import {
  updateItemQuantity,
  removeItem,
  checkoutPickup,
  checkoutSubscription,
} from "@/services/publicCartService";
import { dispatchCartUpdated } from "@/lib/cartEvents";
import { useCartContext } from "../CartProvider";
import { useFingerprint } from "@/hooks/useFingerprint";
import * as yup from "yup";
import { checkoutFormSchema } from "@/features/orders/validations/checkoutForm";
import { calcSubscriptionFees } from "@/constants/commissionConfig";
import { CheckoutGuide } from "@/components/onboarding/CheckoutGuide";

import type { RecurringPurchasesConfig } from "@/types/subscriptions";

type PaymentMode = "single" | "installments" | "recurring";

interface CarritoContentProps {
  tenantId: string;
  sitioSlug: string;
  accentColor: string;
  recurringConfig: RecurringPurchasesConfig;
}

function buildInstallmentOptions(total: number, max: number): number[] {
  const options = [2, 3, 4, 6, 9, 12].filter(
    (n) => n <= max && total / n >= 15,
  );
  return options;
}

function freqLabel(freq: "weekly" | "biweekly" | "monthly"): string {
  if (freq === "weekly") return "Sem.";
  if (freq === "biweekly") return "Quinc.";
  return "Mens.";
}

function freqToValues(freq: "weekly" | "biweekly" | "monthly"): {
  frequency: number;
  frequency_type: "weeks" | "months";
} {
  if (freq === "weekly") return { frequency: 1, frequency_type: "weeks" };
  if (freq === "biweekly") return { frequency: 2, frequency_type: "weeks" };
  return { frequency: 1, frequency_type: "months" };
}

function freqPeriodLabel(freq: "weekly" | "biweekly" | "monthly"): string {
  if (freq === "weekly") return "/ sem";
  if (freq === "biweekly") return "/ quinc";
  return "/ mes";
}

export default function CarritoContent({
  tenantId,
  sitioSlug,
  accentColor,
  recurringConfig,
}: CarritoContentProps) {
  const fingerprint = useFingerprint();
  const { cart, items, subtotal, isLoading, mutate } = useCartContext();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const hasRecurringOptions =
    recurringConfig.installments_enabled || recurringConfig.recurring_enabled;
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("single");
  const [selectedInstallments, setSelectedInstallments] = useState<number>(3);
  const [selectedFrequency, setSelectedFrequency] = useState<
    "weekly" | "biweekly" | "monthly"
  >(recurringConfig.allowed_frequencies[0] ?? "monthly");

  // Bottom-sheet (mobile) checkout state
  const [sheetMounted, setSheetMounted] = useState(false);
  const [sheetVisible, setSheetVisible] = useState(false);

  const installmentOptions = useMemo(
    () => buildInstallmentOptions(subtotal, recurringConfig.max_installments),
    [subtotal, recurringConfig.max_installments],
  );
  const totalUnits = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  useEffect(() => {
    if (
      installmentOptions.length > 0 &&
      !installmentOptions.includes(selectedInstallments)
    ) {
      setSelectedInstallments(installmentOptions[0]);
    }
  }, [installmentOptions, selectedInstallments]);

  const closeSheet = useCallback(() => {
    setSheetVisible(false);
    setTimeout(() => setSheetMounted(false), 250);
  }, []);

  const openSheet = useCallback(() => {
    setSheetMounted(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setSheetVisible(true));
    });
  }, []);

  // Lock body scroll + Esc key while sheet is mounted
  useEffect(() => {
    if (!sheetMounted) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSheet();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [sheetMounted, closeSheet]);

  const feeBreakdown = useMemo(() => {
    if (paymentMode === "single" || subtotal <= 0) return null;

    const discountPercent =
      paymentMode === "recurring"
        ? recurringConfig.subscription_discount_percent
        : 0;
    const discountedAmount = subtotal * (1 - discountPercent / 100);
    const installmentBase =
      paymentMode === "installments"
        ? discountedAmount / selectedInstallments
        : discountedAmount;

    const fees = calcSubscriptionFees(
      installmentBase,
      recurringConfig.fee_absorbed_by,
    );

    return {
      discountPercent,
      discountAmount: subtotal - discountedAmount,
      discountedAmount,
      installmentBase: Math.round(installmentBase * 100) / 100,
      chargePerPeriod: fees.chargeAmount,
      serviceFee: Math.round((fees.chargeAmount - installmentBase) * 100) / 100,
      totalPayments:
        paymentMode === "installments" ? selectedInstallments : null,
      totalPaid:
        paymentMode === "installments"
          ? Math.round(fees.chargeAmount * selectedInstallments * 100) / 100
          : null,
      netReceived: fees.netReceived,
    };
  }, [paymentMode, subtotal, selectedInstallments, recurringConfig]);

  const handleQuantityChange = async (productId: string, quantity: number) => {
    if (!cart || !fingerprint || quantity < 1) return;
    const prevData = { items: [...items], subtotal };
    const updatedItems = items.map((it) =>
      it.product_id === productId ? { ...it, quantity } : it,
    );
    const item = updatedItems.find((it) => it.product_id === productId);
    const price = item ? Number(item.price_snapshot) : 0;
    const oldQty =
      prevData.items.find((i) => i.product_id === productId)?.quantity ?? 0;
    const newSubtotal = subtotal + (quantity - oldQty) * price;
    mutate(
      {
        cart,
        items: updatedItems,
        subtotal: newSubtotal,
        items_count: updatedItems.reduce((s, i) => s + i.quantity, 0),
      },
      { revalidate: false },
    );
    setError(null);
    try {
      await updateItemQuantity(cart.id, productId, quantity, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al actualizar");
    }
  };

  const handleRemove = async (productId: string) => {
    if (!cart || !fingerprint) return;
    const filtered = items.filter((it) => it.product_id !== productId);
    const removed = items.find((it) => it.product_id === productId);
    const newSubtotal = removed
      ? subtotal - Number(removed.price_snapshot) * removed.quantity
      : subtotal;
    mutate(
      {
        cart,
        items: filtered,
        subtotal: newSubtotal,
        items_count: filtered.reduce((s, i) => s + i.quantity, 0),
      },
      { revalidate: false },
    );
    setError(null);
    try {
      await removeItem(cart.id, productId, fingerprint);
      dispatchCartUpdated();
    } catch (e) {
      mutate();
      setError(e instanceof Error ? e.message : "Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || !fingerprint) return;
    setError(null);
    setFieldErrors({});
    try {
      const validated = await checkoutFormSchema.validate(
        {
          customer_name: form.customer_name.trim(),
          customer_email: form.customer_email.trim(),
          customer_phone: form.customer_phone.trim(),
        },
        { abortEarly: false },
      );
      setSubmitting(true);

      if (paymentMode === "single") {
        const result = await checkoutPickup(
          {
            tenant_id: tenantId,
            cart_id: cart.id,
            customer_name: validated.customer_name,
            customer_email: validated.customer_email,
            customer_phone: validated.customer_phone,
          },
          fingerprint,
        );
        window.location.href = result.redirect_url;
      } else {
        const freqValues = freqToValues(selectedFrequency);
        const result = await checkoutSubscription(
          {
            tenant_id: tenantId,
            cart_id: cart.id,
            customer_name: validated.customer_name,
            customer_email: validated.customer_email,
            customer_phone: validated.customer_phone,
            payment_mode: paymentMode,
            installments:
              paymentMode === "installments" ? selectedInstallments : undefined,
            frequency: freqValues.frequency,
            frequency_type: freqValues.frequency_type,
          },
          fingerprint,
        );
        window.location.href = result.init_point;
      }
    } catch (e) {
      if (e instanceof yup.ValidationError) {
        const errs: Record<string, string> = {};
        e.inner.forEach((err) => {
          if (err.path) errs[err.path] = err.message;
        });
        setFieldErrors(errs);
      } else {
        setError(e instanceof Error ? e.message : "Error al finalizar pedido");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const submitLabel = submitting
    ? "Procesando…"
    : paymentMode === "single"
      ? `Pagar $${subtotal.toFixed(2)}`
      : "Continuar al pago";

  const submitDisclaimer =
    paymentMode === "single"
      ? "Se abrirá Mercado Pago para completar tu pago único."
      : paymentMode === "installments"
        ? "Se abrirá Mercado Pago para pagar el primer abono."
        : "Se abrirá Mercado Pago para autorizar tu suscripción.";

  const renderCheckoutBody = (variant: "desktop" | "mobile") => {
    const idPrefix = variant === "mobile" ? "m-" : "";
    const formId = `${idPrefix}checkout-form`;
    return (
      <>
        <div
          className="flex items-center justify-between rounded-xl border-2 px-4 py-4"
          style={{
            borderColor: accentColor,
            backgroundColor: `${accentColor}0c`,
          }}
        >
          <span className="text-sm font-semibold text-gray-700">Subtotal</span>
          <span
            className="text-xl font-bold tabular-nums"
            style={{ color: accentColor }}
          >
            ${subtotal.toFixed(2)}
          </span>
        </div>

        {hasRecurringOptions && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              ¿Cómo quieres pagar?
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode("single")}
                className={`flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                  paymentMode === "single"
                    ? "border-current bg-current/5"
                    : "border-gray-200 text-gray-500 hover:border-gray-300"
                }`}
                style={
                  paymentMode === "single"
                    ? { color: accentColor, borderColor: accentColor }
                    : undefined
                }
              >
                <CreditCard className="h-5 w-5 shrink-0" />
                <span className="text-xs font-semibold leading-tight">
                  Pago único
                </span>
              </button>
              {recurringConfig.installments_enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMode("installments")}
                  className={`flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                    paymentMode === "installments"
                      ? "border-current bg-current/5"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                  style={
                    paymentMode === "installments"
                      ? { color: accentColor, borderColor: accentColor }
                      : undefined
                  }
                >
                  <SplitSquareHorizontal className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">
                    Abonos
                  </span>
                </button>
              )}
              {recurringConfig.recurring_enabled && (
                <button
                  type="button"
                  onClick={() => setPaymentMode("recurring")}
                  className={`flex min-h-[60px] cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center transition-colors ${
                    paymentMode === "recurring"
                      ? "border-current bg-current/5"
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                  style={
                    paymentMode === "recurring"
                      ? { color: accentColor, borderColor: accentColor }
                      : undefined
                  }
                >
                  <Repeat className="h-5 w-5 shrink-0" />
                  <span className="text-xs font-semibold leading-tight">
                    Suscripción
                  </span>
                </button>
              )}
            </div>

            {paymentMode === "installments" &&
              installmentOptions.length > 0 && (
                <div className="space-y-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                  <p className="text-xs font-medium text-gray-600">
                    Divide tu compra en abonos:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {installmentOptions.map((n) => {
                      const perPayment = Math.round((subtotal / n) * 100) / 100;
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setSelectedInstallments(n)}
                          className={`min-h-[40px] cursor-pointer rounded-lg border-2 px-3 py-1.5 text-xs font-semibold tabular-nums transition-colors ${
                            selectedInstallments === n
                              ? "border-current bg-current/5"
                              : "border-gray-200 text-gray-600 hover:border-gray-300"
                          }`}
                          style={
                            selectedInstallments === n
                              ? { color: accentColor, borderColor: accentColor }
                              : undefined
                          }
                        >
                          {n}x ${perPayment.toFixed(2)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            {paymentMode !== "single" && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-600">
                  {paymentMode === "recurring"
                    ? "Recibe tus productos cada:"
                    : "Frecuencia de cobro:"}
                </p>
                <div className="flex gap-2">
                  {recurringConfig.allowed_frequencies.map((freq) => (
                    <button
                      key={freq}
                      type="button"
                      onClick={() => setSelectedFrequency(freq)}
                      className={`min-h-[40px] flex-1 cursor-pointer rounded-lg border-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
                        selectedFrequency === freq
                          ? "border-current bg-current/5"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                      style={
                        selectedFrequency === freq
                          ? { color: accentColor, borderColor: accentColor }
                          : undefined
                      }
                    >
                      {freqLabel(freq)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {feeBreakdown && (
              <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
                {feeBreakdown.discountPercent > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-green-700">
                      Descuento suscripción ({feeBreakdown.discountPercent}%)
                    </span>
                    <span className="font-medium tabular-nums text-green-700">
                      -${feeBreakdown.discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    Cobro {freqPeriodLabel(selectedFrequency)}
                  </span>
                  <span className="font-bold tabular-nums text-gray-900">
                    ${feeBreakdown.chargePerPeriod.toFixed(2)}
                  </span>
                </div>
                {recurringConfig.fee_absorbed_by === "customer" &&
                  feeBreakdown.serviceFee > 0 && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Tarifa de servicio incluida</span>
                      <span className="tabular-nums">
                        ${feeBreakdown.serviceFee.toFixed(2)}
                      </span>
                    </div>
                  )}
                {feeBreakdown.totalPayments && (
                  <>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Cobros</span>
                      <span className="tabular-nums">
                        {feeBreakdown.totalPayments}
                      </span>
                    </div>
                    <div className="border-t border-gray-100 pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">
                          Total de abonos
                        </span>
                        <span className="font-bold tabular-nums text-gray-900">
                          ${feeBreakdown.totalPaid!.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                {paymentMode === "recurring" && (
                  <p className="pt-1 text-xs text-gray-500">
                    Cancela cuando quieras sin penalización.
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <form id={formId} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor={`${idPrefix}checkout-name`}
              className="block text-sm font-medium text-gray-700"
            >
              Nombre
            </label>
            <input
              id={`${idPrefix}checkout-name`}
              type="text"
              autoComplete="name"
              value={form.customer_name}
              onChange={(e) => {
                setForm((f) => ({ ...f, customer_name: e.target.value }));
                if (fieldErrors.customer_name)
                  setFieldErrors((prev) => ({ ...prev, customer_name: "" }));
              }}
              className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.customer_name
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
              }`}
              placeholder="Tu nombre"
            />
            {fieldErrors.customer_name && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.customer_name}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}checkout-email`}
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id={`${idPrefix}checkout-email`}
              type="email"
              autoComplete="email"
              value={form.customer_email}
              onChange={(e) => {
                setForm((f) => ({ ...f, customer_email: e.target.value }));
                if (fieldErrors.customer_email)
                  setFieldErrors((prev) => ({ ...prev, customer_email: "" }));
              }}
              className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.customer_email
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
              }`}
              placeholder="correo@ejemplo.com"
            />
            {fieldErrors.customer_email && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.customer_email}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor={`${idPrefix}checkout-phone`}
              className="block text-sm font-medium text-gray-700"
            >
              Teléfono
            </label>
            <input
              id={`${idPrefix}checkout-phone`}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="tel"
              maxLength={12}
              value={form.customer_phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
                setForm((f) => ({ ...f, customer_phone: digits }));
                if (fieldErrors.customer_phone)
                  setFieldErrors((prev) => ({ ...prev, customer_phone: "" }));
              }}
              className={`mt-1 w-full min-h-[44px] rounded-xl border px-3 py-2.5 text-base transition-colors focus:outline-none focus:ring-2 ${
                fieldErrors.customer_phone
                  ? "border-red-500 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-gray-400 focus:ring-gray-400/20"
              }`}
              placeholder="5512345678"
            />
            {fieldErrors.customer_phone && (
              <p className="mt-1 text-sm text-red-600">
                {fieldErrors.customer_phone}
              </p>
            )}
          </div>

          {variant === "desktop" && (
            <button
              type="submit"
              disabled={submitting}
              className="w-full min-h-[48px] cursor-pointer rounded-xl px-6 py-4 font-semibold text-white transition-opacity duration-200 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ backgroundColor: accentColor }}
            >
              {submitLabel}
            </button>
          )}
        </form>

        {variant === "desktop" && (
          <p className="text-xs text-gray-500">{submitDisclaimer}</p>
        )}
      </>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"
          style={{ borderTopColor: accentColor }}
        />
      </div>
    );
  }

  if (!cart || items.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <ShoppingCart className="h-8 w-8 text-gray-400" />
        </div>
        <p className="mt-4 text-base font-medium text-gray-700">
          Tu carrito está vacío
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Agrega productos para continuar
        </p>
        <Link
          href={`/sitio/${sitioSlug}/productos`}
          className="mt-6 inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          Ir a productos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4  xl:pb-0">
      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {hasRecurringOptions && (
        <CheckoutGuide
          accentColor={accentColor}
          hasInstallments={recurringConfig.installments_enabled}
          hasRecurring={recurringConfig.recurring_enabled}
        />
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)] xl:items-start">
        {/* ── Items column ────────────────────────────────────── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Resumen de tu pedido
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {items.length} {items.length === 1 ? "producto" : "productos"}{" "}
                  en el carrito.
                </p>
              </div>
              <Link
                href={`/sitio/${sitioSlug}/productos`}
                className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                <ArrowLeft className="h-4 w-4" />
                Seguir comprando
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[11px] font-medium text-gray-500">
                  Productos
                </p>
                <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">
                  {items.length}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[11px] font-medium text-gray-500">Piezas</p>
                <p className="mt-1 text-base font-semibold text-gray-900 tabular-nums">
                  {totalUnits}
                </p>
              </div>
              <div className="rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2.5">
                <p className="text-[11px] font-medium text-gray-500">
                  Subtotal
                </p>
                <p
                  className="mt-1 text-base font-semibold tabular-nums"
                  style={{ color: accentColor }}
                >
                  ${subtotal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5">
            <p className="mb-3 text-sm font-semibold text-gray-900">
              Tus artículos
            </p>
            <div className="max-h-[420px] space-y-3 overflow-y-auto overscroll-contain pr-1 sm:max-h-[520px]">
              {items.map((item) => {
                const product = Array.isArray(item.product)
                  ? item.product[0]
                  : item.product;
                const name = product?.name ?? "Producto";
                const imageUrl = product?.image_url ?? null;
                const price = Number(item.price_snapshot);
                const qty = item.quantity;
                const itemSubtotal = price * qty;
                return (
                  <div
                    key={item.id}
                    className="flex gap-3 rounded-xl border border-gray-100 bg-white p-3 transition-shadow duration-200 hover:shadow-sm sm:gap-4 sm:p-4"
                  >
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-24 sm:w-24">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={name}
                          width={96}
                          height={96}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-8 w-8 text-gray-300 sm:h-10 sm:w-10" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-2">
                        {name}
                      </h3>
                      {item.promotion_id && (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Promoción
                        </span>
                      )}
                      <p
                        className="mt-2 text-base font-bold tabular-nums"
                        style={{ color: accentColor }}
                      >
                        ${price.toFixed(2)} × {qty} = ${itemSubtotal.toFixed(2)}
                      </p>
                      <div className="mt-3 flex min-h-[44px] items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(
                              item.product_id,
                              Math.max(1, qty - 1),
                            )
                          }
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
                          aria-label="Reducir cantidad"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-8 px-2 text-center text-sm font-medium tabular-nums">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            handleQuantityChange(item.product_id, qty + 1)
                          }
                          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300/30"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemove(item.product_id)}
                          className="ml-auto flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="hidden gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:grid-cols-3 sm:p-5 lg:grid">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-gray-500" />
              <p className="text-xs font-medium text-gray-700">
                Pago protegido con Mercado Pago
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3">
              <BadgeCheck className="h-5 w-5 shrink-0 text-gray-500" />
              <p className="text-xs font-medium text-gray-700">
                Confirmación inmediata al pagar
              </p>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3">
              <Sparkles className="h-5 w-5 shrink-0 text-gray-500" />
              <p className="text-xs font-medium text-gray-700">
                Cambios de pago según tu preferencia
              </p>
            </div>
          </div>
        </div>

        {/* ── Desktop checkout column (xl+) ───────────────────── */}
        <aside className="hidden xl:block">
          <div className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Finalizar pedido
            </h2>
            <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
              <p className="text-xs text-gray-600">
                Pago seguro y protegido con Mercado Pago.
              </p>
            </div>
            {renderCheckoutBody("desktop")}
          </div>
        </aside>
      </div>

      {/* ── Mobile sticky CTA bar (<xl) ──────────────────────── */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.15)] backdrop-blur xl:hidden">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-gray-500">
              Subtotal
            </p>
            <p
              className="text-lg font-bold tabular-nums"
              style={{ color: accentColor }}
            >
              ${subtotal.toFixed(2)}
            </p>
          </div>
          <button
            type="button"
            onClick={openSheet}
            className="ml-auto inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 sm:flex-none"
            style={{ backgroundColor: accentColor }}
          >
            Continuar al pago
          </button>
        </div>
      </div>

      {/* ── Mobile checkout bottom sheet (<xl) ───────────────── */}
      {sheetMounted && (
        <div
          className="fixed inset-0 z-50 xl:hidden"
          role="dialog"
          aria-modal="true"
          aria-labelledby="mobile-checkout-title"
        >
          <div
            className={`absolute inset-0 bg-black/55 backdrop-blur-[2px] transition-opacity duration-200 ${
              sheetVisible ? "opacity-100" : "opacity-0"
            }`}
            onClick={closeSheet}
            aria-hidden
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex max-h-[94vh] flex-col rounded-t-2xl bg-white shadow-2xl transition-transform duration-300 ease-out will-change-transform ${
              sheetVisible ? "translate-y-0" : "translate-y-full"
            }`}
          >
            {/* Header sticky */}
            <div className="relative shrink-0 border-b border-gray-100 px-4 pb-3 pt-3">
              <div
                className="mx-auto h-1 w-10 rounded-full bg-gray-300"
                aria-hidden
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2
                    id="mobile-checkout-title"
                    className="truncate text-base font-semibold text-gray-900"
                  >
                    Finalizar pedido
                  </h2>
                  <p className="mt-0.5 truncate text-xs text-gray-500">
                    {items.length}{" "}
                    {items.length === 1 ? "producto" : "productos"} · $
                    {subtotal.toFixed(2)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeSheet}
                  className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:bg-gray-50"
                  aria-label="Cerrar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4">
              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Compact items review — keeps user oriented on what they're paying for */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                <div className="flex items-center justify-between gap-3 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Tu pedido
                  </p>
                  <span className="text-xs font-medium text-gray-500 tabular-nums">
                    {totalUnits} {totalUnits === 1 ? "pieza" : "piezas"}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((item) => {
                    const product = Array.isArray(item.product)
                      ? item.product[0]
                      : item.product;
                    const name = product?.name ?? "Producto";
                    const imageUrl = product?.image_url ?? null;
                    const price = Number(item.price_snapshot);
                    const itemSubtotal = price * item.quantity;
                    return (
                      <li key={item.id} className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt=""
                              width={40}
                              height={40}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {name}
                          </p>
                          <p className="text-[11px] text-gray-500 tabular-nums">
                            ${price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <p className="shrink-0 text-sm font-semibold tabular-nums text-gray-900">
                          ${itemSubtotal.toFixed(2)}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-gray-500" />
                <p className="text-xs text-gray-600">
                  Pago seguro y protegido con Mercado Pago.
                </p>
              </div>
              {renderCheckoutBody("mobile")}
            </div>

            {/* Sticky footer */}
            <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-3 backdrop-blur">
              <button
                type="submit"
                form="m-checkout-form"
                disabled={submitting}
                className="w-full min-h-[52px] cursor-pointer rounded-xl px-6 py-3.5 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
                style={{ backgroundColor: accentColor }}
              >
                {submitLabel}
              </button>
              <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
                <Lock className="h-3 w-3" />
                <span>{submitDisclaimer}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
