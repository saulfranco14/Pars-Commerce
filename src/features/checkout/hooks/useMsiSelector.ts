import { useEffect, useMemo, useState } from "react";

import {
  calcMsiBuyerTotal,
  getViableMsiOptions,
} from "@/constants/commissionConfig";
import type { MsiOption } from "@/constants/commissionConfig";
import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface UseMsiSelectorParams {
  paymentMode: PaymentMode;
  subtotal: number;
  selectedInstallments: number;
  feeAbsorbedBy: "customer" | "business";
}

export function useMsiSelector({
  paymentMode,
  subtotal,
  selectedInstallments,
  feeAbsorbedBy,
}: UseMsiSelectorParams) {
  const [msiOption, setMsiOption] = useState<MsiOption>(1);

  const msiBaseAmount = useMemo(() => {
    if (paymentMode === "single") return subtotal;
    if (paymentMode === "installments") {
      return selectedInstallments > 0 ? subtotal / selectedInstallments : 0;
    }
    return 0;
  }, [paymentMode, subtotal, selectedInstallments]);

  const viableMsiOptions = useMemo<MsiOption[]>(() => {
    if (msiBaseAmount <= 0) return [1];
    return getViableMsiOptions(msiBaseAmount, feeAbsorbedBy);
  }, [msiBaseAmount, feeAbsorbedBy]);

  useEffect(() => {
    if (!viableMsiOptions.includes(msiOption)) {
      setMsiOption(viableMsiOptions[0] ?? 1);
    }
  }, [viableMsiOptions, msiOption]);

  useEffect(() => {
    if (paymentMode === "recurring" && msiOption !== 1) {
      setMsiOption(1);
    }
  }, [paymentMode, msiOption]);

  const msiBreakdown = useMemo(() => {
    if (paymentMode === "recurring" || msiBaseAmount <= 0) return null;
    return calcMsiBuyerTotal(msiBaseAmount, msiOption, feeAbsorbedBy);
  }, [paymentMode, msiBaseAmount, msiOption, feeAbsorbedBy]);

  return {
    msiOption,
    setMsiOption,
    msiBaseAmount,
    viableMsiOptions,
    msiBreakdown,
  };
}
