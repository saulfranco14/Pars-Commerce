"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { buildOrderLoanHref } from "@/features/orders/helpers/buildOrderLoanHref";
import { useOrder } from "@/features/orders/hooks/useOrder";
import type { CommerceFulfillmentActionKind } from "@/features/orders/interfaces/commerceFulfillmentAction";
import type { OrderActionDialog } from "@/features/orders/interfaces/orderActionButtons";
import {
  createOrderDeliveryEvent,
  updatePublicOrderRequest,
  type OrderDeliveryEventType,
  type PublicOrderRequestAction,
} from "@/features/orders/services/orderActionService";
import { advanceOrderFulfillment } from "@/features/orders/services/fulfillmentClientService";
import type { FulfillmentStatus } from "@/features/qr/services/tableFulfillmentService";

/**
 * Coordina los efectos de las acciones de una orden. No decide qué botones se
 * muestran ni contiene JSX; esas responsabilidades viven en el resolver y la vista.
 */
export function useOrderActionController() {
  const router = useRouter();
  const {
    order,
    tenantSlug,
    actionLoading,
    handleStatusChange,
    handleExpressToPayment,
    fetchOrder,
    setError,
  } = useOrder();
  const [activeDialog, setActiveDialog] = useState<OrderActionDialog>(null);
  const [requestLoading, setRequestLoading] = useState(false);
  const [fulfillmentLoading, setFulfillmentLoading] = useState<
    FulfillmentStatus | "delivery" | null
  >(null);

  const existingLoan = (
    order as { loan?: { id: string; status: string } | null } | null
  )?.loan;

  function openDialog(dialog: Exclude<OrderActionDialog, null>) {
    setActiveDialog(dialog);
  }

  function closeDialog() {
    setActiveDialog(null);
  }

  function goToLoan() {
    if (!existingLoan?.id) return;
    router.push(`/dashboard/${tenantSlug}/prestamos/${existingLoan.id}`);
  }

  function registerLoan() {
    if (!order) return;
    router.push(buildOrderLoanHref(tenantSlug, order));
  }

  async function runExpressCheckout() {
    if (!order) return;
    const wasUnassigned = !order.assigned_to;
    const ok = await handleExpressToPayment();
    if (!ok) return;
    openDialog(wasUnassigned ? "assign-payment" : "confirm-payment");
  }

  function runPayment() {
    if (!order) return;
    const needsAssignment =
      order.status === "completed" ||
      order.status === "pending_payment" ||
      order.status === "pending_pickup";
    openDialog(needsAssignment ? "assign-payment" : "confirm-payment");
  }

  async function resolvePublicRequest(action: PublicOrderRequestAction) {
    if (!order) return;
    setRequestLoading(true);
    setError(null);
    try {
      await updatePublicOrderRequest(order.id, action);
      await fetchOrder();
      closeDialog();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar la solicitud.",
      );
    } finally {
      setRequestLoading(false);
    }
  }

  async function advanceFulfillment(status: FulfillmentStatus) {
    if (!order) return;
    setFulfillmentLoading(status);
    setError(null);
    try {
      await advanceOrderFulfillment(order.id, status);
      await fetchOrder();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar la preparación.",
      );
    } finally {
      setFulfillmentLoading(null);
    }
  }

  async function registerDeliveryEvent(
    type: OrderDeliveryEventType,
    photo?: File,
    note?: string,
  ) {
    if (!order) return;
    setFulfillmentLoading("delivery");
    setError(null);
    try {
      await createOrderDeliveryEvent(order.id, type, photo, note);
      await fetchOrder();
      if (type === "delivered" || type === "pickup_completed") {
        closeDialog();
      }
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No pudimos actualizar el estado de entrega.",
      );
    } finally {
      setFulfillmentLoading(null);
    }
  }

  function runFulfillmentAction(action: CommerceFulfillmentActionKind) {
    if (action === "start_preparation") {
      void advanceFulfillment("in_progress");
    } else if (action === "mark_ready") {
      void advanceFulfillment("ready");
    } else if (action === "start_delivery") {
      void registerDeliveryEvent("out_for_delivery");
    } else {
      openDialog("delivery-completion");
    }
  }

  return {
    order,
    actionLoading,
    existingLoan,
    activeDialog,
    requestLoading,
    fulfillmentLoading,
    openDialog,
    closeDialog,
    goToLoan,
    registerLoan,
    runExpressCheckout,
    runPayment,
    resolvePublicRequest,
    registerDeliveryEvent,
    runFulfillmentAction,
    changeStatus: (status: string) => void handleStatusChange(status),
  };
}
