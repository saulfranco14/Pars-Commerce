import { resolveOrderActionAvailability } from "@/features/orders/helpers/resolveOrderActionAvailability";
import { resolveOrderActionContext } from "@/features/orders/helpers/resolveOrderActionContext";
import { isTableServiceOrder } from "@/features/orders/helpers/isTableServiceOrder";
import type {
  OrderActionListModel,
  OrderActionsPresentation,
} from "@/features/orders/interfaces/orderActionButtons";
import type {
  OrderDetail,
  OrderTransferProof,
} from "@/features/orders/interfaces/orderDetail";

type ResolveOrderActionModelInput = {
  order: OrderDetail;
  presentation: OrderActionsPresentation;
  tenantId?: string | null;
  isOwner: boolean;
  hasActiveLoan: boolean;
  expressEnabled: boolean;
  canClose: boolean;
  canAddendum: boolean;
  canReviewTransferProof: boolean;
  canPrepare: boolean;
  canDeliver: boolean;
  actionLoading: boolean;
  requestLoading: boolean;
  fulfillmentLoading: boolean;
};

export type ResolvedOrderActionModel = {
  model: OrderActionListModel;
  fulfillmentMethod: "delivery" | "pickup";
  latestTransferProof: OrderTransferProof | null;
};

/**
 * Convierte orden, permisos y capacidades en un modelo listo para presentar.
 * No navega, no llama APIs y no renderiza componentes.
 */
export function resolveOrderActionModel({
  order,
  presentation,
  tenantId,
  isOwner,
  hasActiveLoan,
  expressEnabled,
  canClose,
  canAddendum,
  canReviewTransferProof,
  canPrepare,
  canDeliver,
  actionLoading,
  requestLoading,
  fulfillmentLoading,
}: ResolveOrderActionModelInput): ResolvedOrderActionModel {
  const canStartOrComplete = (order.items?.length ?? 0) > 0;
  const availability = resolveOrderActionAvailability({
    order,
    canPrepare,
    canDeliver,
    canReviewTransferProof,
  });
  const isEditableStatus = ["draft", "assigned", "in_progress"].includes(
    order.status,
  );
  const isTableOrder = isTableServiceOrder(order);
  const hasPendingCustomerPayment = (order.payments ?? []).some(
    (p) => p.provider === "manual" && p.status === "pending",
  );
  const showExpress =
    !availability.isPublicStoreOrder &&
    !isTableOrder &&
    expressEnabled &&
    isEditableStatus &&
    canStartOrComplete;
  const showCancel =
    canClose &&
    ["draft", "assigned", "in_progress", "pending_pickup", "paid"].includes(
      order.status,
    );
  const showAddendum =
    canAddendum && ["paid", "completed"].includes(order.status);
  const showViewLoan = isOwner && hasActiveLoan;
  const showRegisterLoan =
    isOwner &&
    !availability.isPublicStoreOrder &&
    !hasActiveLoan &&
    order.status !== "cancelled" &&
    order.status !== "paid";
  const context = resolveOrderActionContext({
    status: order.status,
    showTransferProofReview: availability.showTransferProofReview,
    waitsForTransferProof: availability.waitsForTransferProof,
    fulfillmentAction: availability.fulfillmentAction,
    hasFinishedDelivery: availability.fulfillmentFinished,
    paymentSettled: availability.paymentSettled,
    isTableOrder,
    hasPendingCustomerPayment,
  });

  return {
    model: {
      presentation,
      order,
      tenantId,
      isOwner,
      isPublicStoreOrder: availability.isPublicStoreOrder,
      isTableOrder,
      paymentSettled: availability.paymentSettled,
      fulfillmentFinished: availability.fulfillmentFinished,
      showTransferProofReview: availability.showTransferProofReview,
      waitsForTransferProof: availability.waitsForTransferProof,
      fulfillmentAction: availability.fulfillmentAction,
      showExpress,
      showCancel,
      showViewLoan,
      showRegisterLoan,
      showAddendum,
      canStartOrComplete,
      actionLoading,
      requestLoading,
      fulfillmentLoading,
      context,
    },
    fulfillmentMethod: availability.fulfillmentMethod,
    latestTransferProof: availability.latestTransferProof,
  };
}
