"use client";

import {
  useActiveTenant,
  usePermission,
  useTenantStore,
} from "@/stores/useTenantStore";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";
import type { OrderActionButtonsProps } from "@/features/orders/interfaces/orderActionButtons";
import { OrderActionDialogs } from "./OrderActionDialogs";
import { isExpressOrderEnabled } from "@/features/orders/helpers/isExpressOrderEnabled";
import { resolveOrderActionModel } from "@/features/orders/helpers/resolveOrderActionModel";
import { useOrderActionController } from "@/features/orders/hooks/useOrderActionController";
import { OrderActionList } from "./OrderActionList";

export function OrderActionButtons({
  presentation,
}: OrderActionButtonsProps) {
  const {
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
    changeStatus,
  } = useOrderActionController();
  const activeTenant = useActiveTenant();
  const activeRole = useTenantStore((s) => s.activeRole)();
  const isOwner = activeRole?.name === "owner";
  const can = usePermission();

  if (!order) return null;
  const hasActiveLoan = Boolean(
    existingLoan && existingLoan.status !== "cancelled",
  );
  const { model, fulfillmentMethod, latestTransferProof } =
    resolveOrderActionModel({
      order,
      presentation,
      tenantId: activeTenant?.id,
      isOwner,
      hasActiveLoan,
      expressEnabled: isExpressOrderEnabled(activeTenant?.settings),
      canClose: can(ORDER_PERMISSIONS.close),
      canAddendum: can(ORDER_PERMISSIONS.addendum),
      canReviewTransferProof: can(ORDER_PERMISSIONS.take) || isOwner,
      canPrepare: can(ORDER_PERMISSIONS.prepare),
      canDeliver: can(ORDER_PERMISSIONS.deliver),
      actionLoading,
      requestLoading,
      fulfillmentLoading: fulfillmentLoading !== null,
    });

  return (
    <>
      <OrderActionList
        model={model}
        commands={{
          openDialog,
          runFulfillmentAction,
          runExpressCheckout: () => void runExpressCheckout(),
          runPayment,
          changeStatus,
          goToLoan,
          registerLoan,
        }}
      />

      <OrderActionDialogs
        activeDialog={activeDialog}
        isPublicStoreOrder={model.isPublicStoreOrder}
        fulfillmentMethod={fulfillmentMethod}
        latestTransferProof={latestTransferProof}
        requestLoading={requestLoading}
        fulfillmentLoading={fulfillmentLoading}
        onClose={closeDialog}
        onResolvePublicRequest={resolvePublicRequest}
        onRegisterDeliveryEvent={registerDeliveryEvent}
      />
    </>
  );
}
