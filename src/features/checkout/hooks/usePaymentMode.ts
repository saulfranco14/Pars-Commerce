import { useEffect, useMemo, useState } from "react";

import { calcSubscriptionFees } from "@/constants/commissionConfig";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";

import type { CartFrequency } from "@/features/checkout/helpers/cartFrequency";
import { buildInstallmentOptions } from "@/features/checkout/helpers/installmentBuilder";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface UsePaymentModeParams {
  subtotal: number;
  recurringConfig: RecurringPurchasesConfig;
}

export interface FeeBreakdown {
  discountPercent: number;
  discountAmount: number;
  discountedAmount: number;
  installmentBase: number;
  chargePerPeriod: number;
  serviceFee: number;
  totalPayments: number | null;
  totalPaid: number | null;
  netReceived: number;
}

export function usePaymentMode({
  subtotal,
  recurringConfig,
}: UsePaymentModeParams) {
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("single");
  const [selectedInstallments, setSelectedInstallments] = useState<number>(3);
  const [selectedFrequency, setSelectedFrequency] = useState<CartFrequency>(
    recurringConfig.allowed_frequencies[0] ?? "monthly",
  );

  const installmentOptions = useMemo(
    () => buildInstallmentOptions(subtotal, recurringConfig.max_installments),
    [subtotal, recurringConfig.max_installments],
  );

  useEffect(() => {
    if (
      installmentOptions.length > 0 &&
      !installmentOptions.includes(selectedInstallments)
    ) {
      setSelectedInstallments(installmentOptions[0]);
    }
  }, [installmentOptions, selectedInstallments]);

  const feeBreakdown = useMemo<FeeBreakdown | null>(() => {
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

  return {
    paymentMode,
    setPaymentMode,
    selectedInstallments,
    setSelectedInstallments,
    selectedFrequency,
    setSelectedFrequency,
    installmentOptions,
    feeBreakdown,
  };
}
