import { resolveOrderFulfillmentMethod } from "@/features/orders/helpers/resolveOrderFulfillmentMethod";
import type { CommerceFulfillmentActionKind } from "@/features/orders/interfaces/commerceFulfillmentAction";
import type {
  OrderDetail,
  OrderTransferProof,
} from "@/features/orders/interfaces/orderDetail";

type ResolveOrderActionAvailabilityInput = {
  order: OrderDetail;
  canPrepare: boolean;
  canDeliver: boolean;
  canReviewTransferProof: boolean;
};

export type OrderActionAvailability = {
  isPublicStoreOrder: boolean;
  paymentSettled: boolean;
  fulfillmentMethod: "delivery" | "pickup";
  fulfillmentFinished: boolean;
  latestTransferProof: OrderTransferProof | null;
  showTransferProofReview: boolean;
  waitsForTransferProof: boolean;
  fulfillmentAction: CommerceFulfillmentActionKind | null;
};

/**
 * Única responsabilidad: convertir el estado persistido de la orden en las
 * acciones ecommerce disponibles. No renderiza ni ejecuta efectos.
 */
export function resolveOrderActionAvailability({
  order,
  canPrepare,
  canDeliver,
  canReviewTransferProof,
}: ResolveOrderActionAvailabilityInput): OrderActionAvailability {
  const isPublicStoreOrder = order.source === "public_store";
  const paymentSettled =
    order.status === "paid" ||
    Boolean(order.paid_at) ||
    Number(order.paid_total ?? 0) >= Number(order.total) ||
    order.payment_verification_status === "approved";
  const latestTransferProof = order.transfer_proofs?.[0] ?? null;
  const showTransferProofReview =
    isPublicStoreOrder &&
    canReviewTransferProof &&
    !paymentSettled &&
    order.payment_verification_status === "proof_submitted" &&
    latestTransferProof?.status === "pending_review";
  const waitsForTransferProof =
    isPublicStoreOrder &&
    ["bank_transfer", "transferencia"].includes(order.payment_method ?? "") &&
    !paymentSettled &&
    ["proof_required", "rejected"].includes(
      order.payment_verification_status ?? "",
    );

  const fulfillmentMethod = resolveOrderFulfillmentMethod(order) ?? "pickup";
  const completionType =
    fulfillmentMethod === "delivery" ? "delivered" : "pickup_completed";
  const deliveryEvents = order.delivery_events ?? [];
  const completionEvent = deliveryEvents.find(
    (event) => event.type === completionType,
  );
  // Una orden antigua puede tener un evento de cierre sin foto y otro evento
  // posterior con la evidencia. La existencia de la foto no debe depender del
  // primer evento encontrado.
  const evidenceEvent = [...deliveryEvents]
    .reverse()
    .find(
      (event) =>
        event.type === completionType && Boolean(event.photo_path?.trim()),
    );
  const hasOutForDelivery = deliveryEvents.some(
    (event) => event.type === "out_for_delivery",
  );
  const hasLegacyPickupCompletion =
    fulfillmentMethod === "pickup" && Boolean(order.pickup_completed_at);
  const fulfillmentFinished =
    Boolean(completionEvent) || hasLegacyPickupCompletion;
  const fulfillmentStatus = order.fulfillment_status ?? "received";

  const needsDeliveryEvidence =
    isPublicStoreOrder &&
    paymentSettled &&
    canDeliver &&
    fulfillmentFinished &&
    !evidenceEvent;
  const showStartPreparation =
    isPublicStoreOrder &&
    paymentSettled &&
    canPrepare &&
    order.status !== "pending_acceptance" &&
    fulfillmentStatus === "received" &&
    !fulfillmentFinished;
  const showMarkReady =
    isPublicStoreOrder &&
    paymentSettled &&
    canPrepare &&
    fulfillmentStatus === "in_progress" &&
    !fulfillmentFinished;
  const showOutForDelivery =
    isPublicStoreOrder &&
    paymentSettled &&
    canDeliver &&
    fulfillmentMethod === "delivery" &&
    fulfillmentStatus === "ready" &&
    !hasOutForDelivery &&
    !fulfillmentFinished;
  const showConfirmDelivery =
    isPublicStoreOrder &&
    paymentSettled &&
    canDeliver &&
    fulfillmentMethod === "delivery" &&
    hasOutForDelivery &&
    !fulfillmentFinished;
  const showCompletePickup =
    (isPublicStoreOrder ? paymentSettled : order.status === "paid") &&
    !order.pickup_completed_at &&
    !fulfillmentFinished &&
    ((isPublicStoreOrder &&
      canDeliver &&
      fulfillmentMethod === "pickup" &&
      fulfillmentStatus === "ready") ||
      (!isPublicStoreOrder && Boolean(order.scheduled_for)));

  const fulfillmentAction: CommerceFulfillmentActionKind | null =
    needsDeliveryEvidence
      ? "add_evidence"
      : showStartPreparation
        ? "start_preparation"
        : showMarkReady
          ? "mark_ready"
          : showOutForDelivery
            ? "start_delivery"
            : showConfirmDelivery
              ? "confirm_delivery"
              : showCompletePickup
                ? "complete_pickup"
                : null;

  return {
    isPublicStoreOrder,
    paymentSettled,
    fulfillmentMethod,
    fulfillmentFinished,
    latestTransferProof,
    showTransferProofReview,
    waitsForTransferProof,
    fulfillmentAction,
  };
}
