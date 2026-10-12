import type { CommerceFulfillmentActionKind } from "./commerceFulfillmentAction";
import type { OrderDetail } from "./orderDetail";

export type OrderActionsPresentation = "inline" | "fixed";

/** Sólo un flujo modal de la orden puede estar activo a la vez. */
export type OrderActionDialog =
  | "cancel"
  | "addendum"
  | "assign-payment"
  | "confirm-payment"
  | "payment-link"
  | "credit"
  | "accept-request"
  | "reject-request"
  | "delivery-completion"
  | "proof-review"
  | null;

export type OrderActionButtonsProps = {
  presentation: OrderActionsPresentation;
};

export type OrderActionListModel = {
  presentation: OrderActionsPresentation;
  order: OrderDetail;
  tenantId?: string | null;
  isOwner: boolean;
  isPublicStoreOrder: boolean;
  paymentSettled: boolean;
  fulfillmentFinished: boolean;
  showTransferProofReview: boolean;
  waitsForTransferProof: boolean;
  fulfillmentAction: CommerceFulfillmentActionKind | null;
  showExpress: boolean;
  showCancel: boolean;
  showViewLoan: boolean;
  showRegisterLoan: boolean;
  showAddendum: boolean;
  canStartOrComplete: boolean;
  actionLoading: boolean;
  requestLoading: boolean;
  fulfillmentLoading: boolean;
  context: { label: string; detail: string };
};

export type OrderActionListCommands = {
  openDialog: (dialog: Exclude<OrderActionDialog, null>) => void;
  runFulfillmentAction: (action: CommerceFulfillmentActionKind) => void;
  runExpressCheckout: () => void;
  runPayment: () => void;
  changeStatus: (status: string) => void;
  goToLoan: () => void;
  registerLoan: () => void;
};
