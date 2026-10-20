import {
  COMMERCE_FULFILLMENT_COPY,
  type CommerceFulfillmentActionKind,
} from "@/features/orders/interfaces/commerceFulfillmentAction";

type ResolveOrderActionContextInput = {
  status: string;
  showTransferProofReview: boolean;
  waitsForTransferProof: boolean;
  fulfillmentAction: CommerceFulfillmentActionKind | null;
  hasFinishedDelivery: boolean;
  paymentSettled: boolean;
  isTableOrder?: boolean;
  hasPendingCustomerPayment?: boolean;
};

export type OrderActionContext = {
  label: string;
  detail: string;
};

/**
 * Decide el mensaje del bloque de acciones sin mezclar esa política con el JSX.
 * El orden importa: comprobante y entrega tienen prioridad sobre el ciclo general.
 */
export function resolveOrderActionContext({
  status,
  showTransferProofReview,
  waitsForTransferProof,
  fulfillmentAction,
  hasFinishedDelivery,
  paymentSettled,
  isTableOrder = false,
  hasPendingCustomerPayment = false,
}: ResolveOrderActionContextInput): OrderActionContext {
  // A table has no delivery step and is paid through its account.
  if (isTableOrder) {
    if (hasPendingCustomerPayment) {
      return {
        label: "El cliente ya reportó su pago",
        detail: "Confírmalo con «Recibí el dinero» aquí o en Caja.",
      };
    }
    if (paymentSettled || status === "paid") {
      return { label: "Mesa pagada", detail: "Todo está cobrado. No queda nada pendiente." };
    }
    return {
      label: "Se cobra al final",
      detail: "Cuando el cliente pague, confírmalo aquí o desde Caja.",
    };
  }

  if (showTransferProofReview) {
    return {
      label: "Comprobante recibido",
      detail: "Revisa el archivo y confirma o rechaza la transferencia.",
    };
  }

  if (waitsForTransferProof) {
    return {
      label: "Pago pendiente",
      detail: "El cliente debe enviar un comprobante válido para continuar.",
    };
  }

  if (fulfillmentAction) {
    const copy = COMMERCE_FULFILLMENT_COPY[fulfillmentAction];
    return { label: copy.title, detail: copy.description };
  }

  if (hasFinishedDelivery) {
    return {
      label: "Pedido entregado",
      detail: "La entrega y su fotografía ya están disponibles para el cliente.",
    };
  }

  if (status === "pending_acceptance") {
    return {
      label: "Solicitud nueva",
      detail: "Elige si el negocio puede prepararla.",
    };
  }

  if (status === "draft" || status === "assigned") {
    return {
      label: "Siguiente paso",
      detail: "Revisa el ticket y envíalo a preparación.",
    };
  }

  if (status === "in_progress") {
    return {
      label: "Siguiente paso",
      detail: "Confirma cuando el pedido esté listo para cobrar.",
    };
  }

  if (paymentSettled) {
    return {
      label: "Entrega pendiente",
      detail: "El cobro ya está confirmado. Continúa únicamente con la entrega.",
    };
  }

  if (status === "completed") {
    return {
      label: "Cobrar orden",
      detail: "Elige cómo registrar el pago del cliente.",
    };
  }

  return {
    label: "Acciones de la orden",
    detail: "Selecciona la acción que necesitas.",
  };
}
