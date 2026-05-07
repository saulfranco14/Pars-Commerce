import type { MsiOption } from "@/constants/commissionConfig";

import type { PaymentMode } from "@/features/checkout/interfaces/paymentMode";

interface SubmitLabelsParams {
  submitting: boolean;
  paymentMode: PaymentMode;
  msiOption: MsiOption;
  /** Monto real que se cargará al cliente (incluye comisión si la absorbe). */
  payAmount: number;
  perMonth: number;
  /** true cuando el cliente absorbe la comisión MP y payAmount > subtotal. */
  customerAbsorbsFee: boolean;
}

export interface SubmitLabels {
  submitLabel: string;
  submitDisclaimer: string;
}

export function getSubmitLabels({
  submitting,
  paymentMode,
  msiOption,
  payAmount,
  perMonth,
  customerAbsorbsFee,
}: SubmitLabelsParams): SubmitLabels {
  const submitLabel = submitting
    ? "Procesando…"
    : paymentMode === "single"
      ? msiOption > 1
        ? `Pagar $${payAmount.toFixed(2)} a ${msiOption} MSI`
        : `Pagar $${payAmount.toFixed(2)}`
      : "Continuar al pago";

  const singleDisclaimer =
    msiOption > 1
      ? `Se abrirá Mercado Pago. Cobro a ${msiOption} meses sin intereses (~$${perMonth.toFixed(2)}/mes con tarjeta de crédito participante).`
      : customerAbsorbsFee
        ? `Se abrirá Mercado Pago. El total incluye la comisión de procesamiento.`
        : "Se abrirá Mercado Pago para completar tu pago único.";

  const submitDisclaimer =
    paymentMode === "single"
      ? singleDisclaimer
      : paymentMode === "installments"
        ? msiOption > 1
          ? `Se abrirá Mercado Pago. El primer abono se cobra a ${msiOption} MSI.`
          : "Se abrirá Mercado Pago para pagar el primer abono."
        : "Se abrirá Mercado Pago para autorizar tu suscripción.";

  return { submitLabel, submitDisclaimer };
}
