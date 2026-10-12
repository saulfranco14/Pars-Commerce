"use client";

import { useRouter } from "next/navigation";

import { ConfirmModal } from "@/components/ConfirmModal";
import { useActiveTenant } from "@/stores/useTenantStore";
import { useOrder } from "@/features/orders/hooks/useOrder";
import type { OrderActionDialog } from "@/features/orders/interfaces/orderActionButtons";
import type { OrderTransferProof } from "@/features/orders/interfaces/orderDetail";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";
import { AssignBeforePaidModal } from "@/features/orders/components/payment/AssignBeforePaidModal";
import { ConfirmPaymentModal } from "@/features/orders/components/payment/ConfirmPaymentModal";
import { AddendumSheet } from "./AddendumSheet";
import { DeliveryCompletionSheet } from "./DeliveryCompletionSheet";
import { GenerateLinkModal } from "./GenerateLinkModal";
import { OrderCreditSheet } from "./OrderCreditSheet";
import { TransferProofReviewSheet } from "./TransferProofReviewSheet";

type OrderActionDialogsProps = {
  activeDialog: OrderActionDialog;
  isPublicStoreOrder: boolean;
  fulfillmentMethod: "delivery" | "pickup";
  latestTransferProof: OrderTransferProof | null;
  requestLoading: boolean;
  fulfillmentLoading: FulfillmentStatus | "delivery" | null;
  onClose: () => void;
  onResolvePublicRequest: (
    action: "accept-request" | "reject-request",
  ) => Promise<void>;
  onRegisterDeliveryEvent: (
    type: "out_for_delivery" | "delivered" | "pickup_completed",
    photo?: File,
    note?: string,
  ) => Promise<void>;
};

/** Única responsabilidad: montar el diálogo activo de las acciones de orden. */
export function OrderActionDialogs({
  activeDialog,
  isPublicStoreOrder,
  fulfillmentMethod,
  latestTransferProof,
  requestLoading,
  fulfillmentLoading,
  onClose,
  onResolvePublicRequest,
  onRegisterDeliveryEvent,
}: OrderActionDialogsProps) {
  const router = useRouter();
  const activeTenant = useActiveTenant();
  const {
    order,
    team,
    tenantSlug,
    actionLoading,
    handleStatusChange,
    handleAssignAndMarkPaid,
    handleMarkAsPaidWithMethod,
    handleGeneratePaymentLink,
    fetchOrder,
    setError,
  } = useOrder();

  if (!order) return null;

  return (
    <>
      {activeTenant ? (
        <AddendumSheet
          isOpen={activeDialog === "addendum"}
          onClose={onClose}
          tenantId={activeTenant.id}
          parentOrderId={order.id}
          onCreated={(childId) =>
            router.push(`/dashboard/${tenantSlug}/ordenes/${childId}`)
          }
        />
      ) : null}

      <DeliveryCompletionSheet
        open={activeDialog === "delivery-completion"}
        busy={fulfillmentLoading === "delivery"}
        onClose={onClose}
        onSubmit={(photo, note) =>
          onRegisterDeliveryEvent(
            fulfillmentMethod === "pickup"
              ? "pickup_completed"
              : "delivered",
            photo,
            note,
          )
        }
      />

      <TransferProofReviewSheet
        open={activeDialog === "proof-review"}
        orderId={order.id}
        orderTotal={Number(order.total)}
        proof={latestTransferProof}
        onClose={onClose}
        onReviewed={fetchOrder}
        onError={(message) => setError(message || null)}
      />

      <ConfirmModal
        isOpen={activeDialog === "cancel"}
        onClose={onClose}
        onConfirm={async () => {
          await handleStatusChange("cancelled");
          onClose();
        }}
        title="Cancelar orden"
        message="¿Estás seguro de que deseas cancelar esta orden? Esta acción no se puede deshacer y la orden no podrá recuperarse."
        confirmLabel="Sí, cancelar"
        confirmDanger
        loading={actionLoading}
      />

      <ConfirmModal
        isOpen={activeDialog === "accept-request"}
        onClose={onClose}
        onConfirm={() => void onResolvePublicRequest("accept-request")}
        title="Aceptar solicitud"
        message="Se validará la disponibilidad y el pedido pasará a preparación. El cliente podrá ver que fue aceptado."
        confirmLabel="Aceptar pedido"
        confirmDanger={false}
        loading={requestLoading}
      />

      <ConfirmModal
        isOpen={activeDialog === "reject-request"}
        onClose={onClose}
        onConfirm={() => void onResolvePublicRequest("reject-request")}
        title="Rechazar solicitud"
        message="El pedido se cancelará y el cliente verá que no puede atenderse por ahora."
        confirmLabel="Rechazar pedido"
        confirmDanger
        loading={requestLoading}
      />

      <AssignBeforePaidModal
        isOpen={activeDialog === "assign-payment"}
        onClose={onClose}
        onConfirm={async (assignToId, paymentMethod) => {
          await handleAssignAndMarkPaid(
            assignToId,
            isPublicStoreOrder && order.payment_method
              ? order.payment_method
              : paymentMethod,
          );
          onClose();
        }}
        team={team}
        lockedPaymentMethod={
          isPublicStoreOrder ? order.payment_method : null
        }
        loading={actionLoading}
      />

      <ConfirmPaymentModal
        isOpen={activeDialog === "confirm-payment"}
        onClose={onClose}
        onConfirm={async (paymentMethod) => {
          await handleMarkAsPaidWithMethod(
            isPublicStoreOrder && order.payment_method
              ? order.payment_method
              : paymentMethod,
          );
          onClose();
        }}
        total={Number(order.total)}
        lockedPaymentMethod={
          isPublicStoreOrder ? order.payment_method : null
        }
        loading={actionLoading}
      />

      <GenerateLinkModal
        isOpen={activeDialog === "payment-link"}
        onClose={onClose}
        onConfirm={async () => {
          await handleGeneratePaymentLink();
          onClose();
        }}
        vendorTotal={Number(order.total)}
        customerName={order.customer_name}
        customerEmail={order.customer_email}
        loading={actionLoading}
      />

      {activeTenant ? (
        <OrderCreditSheet
          open={activeDialog === "credit"}
          onClose={onClose}
          tenantId={activeTenant.id}
          orderId={order.id}
          customerId={order.customer_id}
          total={Number(order.total)}
          onCharged={fetchOrder}
        />
      ) : null}
    </>
  );
}
