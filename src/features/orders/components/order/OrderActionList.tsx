"use client";

import {
  Banknote,
  CheckCircle,
  DollarSign,
  ExternalLink,
  FileCheck2,
  PackagePlus,
  PlayCircle,
  Smartphone,
  X,
  Zap,
} from "lucide-react";

import { WhatsAppShareButton } from "@/components/communications/WhatsAppShareButton";
import {
  orderWhatsAppButtonClass,
  orderWhatsAppContainerClass,
} from "@/features/orders/constants/orderActionStyles";
import type {
  OrderActionListCommands,
  OrderActionListModel,
} from "@/features/orders/interfaces/orderActionButtons";
import { CommerceFulfillmentAction } from "./CommerceFulfillmentAction";
import { OrderActionButton } from "./OrderActionButton";
import { OrderActionsSurface } from "./OrderActionsSurface";

type OrderActionListProps = {
  model: OrderActionListModel;
  commands: OrderActionListCommands;
};

/** Única responsabilidad: presentar las acciones que el controlador resolvió. */
export function OrderActionList({ model, commands }: OrderActionListProps) {
  const {
    presentation,
    order,
    tenantId,
    isOwner,
    isPublicStoreOrder,
    paymentSettled,
    fulfillmentFinished,
    showTransferProofReview,
    waitsForTransferProof,
    fulfillmentAction,
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
  } = model;
  const hasNoItems = !canStartOrComplete;

  return (
    <OrderActionsSurface
      presentation={presentation}
      title={context.label}
      description={context.detail}
    >
      {showTransferProofReview ? (
        <OrderActionButton
          tone="accent"
          icon={FileCheck2}
          onClick={() => commands.openDialog("proof-review")}
        >
          Revisar comprobante
        </OrderActionButton>
      ) : null}

      {fulfillmentAction ? (
        <CommerceFulfillmentAction
          action={fulfillmentAction}
          busy={fulfillmentLoading}
          onAction={commands.runFulfillmentAction}
        />
      ) : null}

      {order.status === "pending_acceptance" ? (
        <>
          {presentation === "inline" ? (
            <OrderActionButton
              tone="destructive"
              icon={X}
              onClick={() => commands.openDialog("reject-request")}
              disabled={requestLoading}
            >
              Rechazar solicitud
            </OrderActionButton>
          ) : null}
          <OrderActionButton
            tone="success"
            icon={CheckCircle}
            onClick={() => commands.openDialog("accept-request")}
            disabled={requestLoading}
          >
            Aceptar para preparar
          </OrderActionButton>
        </>
      ) : null}

      {showExpress ? (
        <OrderActionButton
          tone="success"
          icon={Zap}
          onClick={commands.runExpressCheckout}
          disabled={actionLoading}
        >
          Ir al cobro
        </OrderActionButton>
      ) : null}

      {showCancel && presentation === "inline" ? (
        <OrderActionButton
          tone="secondary"
          icon={X}
          onClick={() => commands.openDialog("cancel")}
          disabled={actionLoading}
        >
          Cancelar orden
        </OrderActionButton>
      ) : null}

      {!isPublicStoreOrder &&
      !showExpress &&
      ["draft", "assigned"].includes(order.status) ? (
        <OrderActionButton
          tone="primary"
          icon={PlayCircle}
          onClick={() => commands.changeStatus("in_progress")}
          disabled={actionLoading || !canStartOrComplete}
          title={
            hasNoItems
              ? "Agrega al menos un producto o servicio para continuar"
              : undefined
          }
        >
          Pasar a preparación
        </OrderActionButton>
      ) : null}

      {!isPublicStoreOrder &&
      !showExpress &&
      order.status === "in_progress" ? (
        <OrderActionButton
          tone="success"
          icon={CheckCircle}
          onClick={() => commands.changeStatus("completed")}
          disabled={actionLoading || !canStartOrComplete}
          title={
            hasNoItems
              ? "La orden debe tener productos o servicios para continuar"
              : undefined
          }
        >
          Lista para cobro
        </OrderActionButton>
      ) : null}

      {order.status === "completed" &&
      !fulfillmentFinished &&
      !paymentSettled ? (
        <>
          <OrderActionButton
            tone="success"
            icon={DollarSign}
            onClick={commands.runPayment}
            disabled={actionLoading}
          >
            Cobro directo
          </OrderActionButton>
          {presentation === "inline" ? (
            <OrderActionButton
              tone="accent"
              icon={Smartphone}
              onClick={() => commands.openDialog("payment-link")}
              disabled={actionLoading}
            >
              Generar cobro (MercadoPago)
            </OrderActionButton>
          ) : null}
          {isOwner && presentation === "inline" ? (
            <OrderActionButton
              tone="secondary"
              icon={Banknote}
              onClick={() => commands.openDialog("credit")}
              disabled={actionLoading}
            >
              Agregar a crédito
            </OrderActionButton>
          ) : null}
        </>
      ) : null}

      {!paymentSettled &&
      !showTransferProofReview &&
      !waitsForTransferProof &&
      ["pending_payment", "pending_pickup"].includes(order.status) ? (
        <OrderActionButton
          tone="success"
          icon={DollarSign}
          onClick={commands.runPayment}
          disabled={actionLoading}
        >
          {order.status === "pending_pickup"
            ? "Marcar como cobrado (recogió)"
            : "Marcar como pagado"}
        </OrderActionButton>
      ) : null}

      {showViewLoan && presentation === "inline" ? (
        <OrderActionButton
          tone="secondary"
          icon={ExternalLink}
          onClick={commands.goToLoan}
        >
          Ver préstamo
        </OrderActionButton>
      ) : null}

      {showRegisterLoan && presentation === "inline" ? (
        <OrderActionButton
          tone="secondary"
          icon={Banknote}
          onClick={commands.registerLoan}
          disabled={actionLoading}
        >
          Registrar como préstamo
        </OrderActionButton>
      ) : null}

      {showAddendum && presentation === "inline" ? (
        <OrderActionButton
          tone="secondary"
          icon={PackagePlus}
          onClick={() => commands.openDialog("addendum")}
          disabled={actionLoading}
        >
          Agregar lo que faltó
        </OrderActionButton>
      ) : null}

      {tenantId && order.customer_phone ? (
        <WhatsAppShareButton
          tenantId={tenantId}
          entityType="order"
          entityId={order.id}
          recipientPhone={order.customer_phone}
          eventType="pickup_ready_shared"
          className={orderWhatsAppContainerClass}
          buttonClassName={orderWhatsAppButtonClass}
        />
      ) : null}
    </OrderActionsSurface>
  );
}
