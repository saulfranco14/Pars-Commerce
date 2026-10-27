import type { PickupPointDraft } from "@/features/configuracion/interfaces/paymentsAndDelivery";

export type SetupFulfillment = "pickup" | "delivery" | "onsite";
export type SetupPaymentMethod = "cash" | "transfer" | "digital";

export interface SetupDeliveryDraft {
  area: string;
  fee: string;
}

export interface SetupTransferDraft {
  bank_name: string;
  account_holder: string;
  clabe: string;
}

export interface SetupFulfillmentInput {
  step: "fulfillment";
  fulfillment: SetupFulfillment;
  pickupPoint?: PickupPointDraft | null;
  delivery?: SetupDeliveryDraft | null;
}

export interface SetupPaymentInput {
  step: "payment";
  method: SetupPaymentMethod;
  transfer?: SetupTransferDraft | null;
}

export type SetupCheckoutInput = SetupFulfillmentInput | SetupPaymentInput;

/** What the setup wizard needs to resume the checkout drafts it already saved. */
export interface SetupCheckoutSnapshot {
  pickupPoint: PickupPointDraft | null;
  delivery: SetupDeliveryDraft;
  transfer: SetupTransferDraft;
  onlinePaymentConnected: boolean;
}

export interface SetupFulfillmentDetailsProps {
  fulfillment: SetupFulfillment;
  pickupPoint: PickupPointDraft;
  delivery: SetupDeliveryDraft;
  onPickupPointChange: (next: PickupPointDraft) => void;
  onDeliveryChange: (next: SetupDeliveryDraft) => void;
}

export interface SetupPaymentDetailsProps {
  tenantId: string;
  method: SetupPaymentMethod;
  transfer: SetupTransferDraft;
  onTransferChange: (next: SetupTransferDraft) => void;
}
