import type { IntentMethod } from "@/features/qr/services/tablePaymentService";

/** What the charge sheet needs from an order, wherever it is opened. */
export interface ChargeTarget {
  id: string;
  number: string;
  /** What is left to pay. */
  due: number;
  originLabel?: string | null;
  customerName?: string | null;
  /** Checkout method (cash, bank_transfer…); a counter method here is preselected and fixed. */
  paymentMethod?: string | null;
  /** Nobody assigned yet: the sheet asks who attended before charging. */
  assignedTo?: string | null;
}

export interface ChargeTeamMember {
  userId: string;
  name: string;
}

export interface ChargeResult {
  amount: number;
  method: IntentMethod;
}

export interface ChargeSheetProps {
  /** The order to charge; null closes the sheet. */
  target: ChargeTarget | null;
  team: ChargeTeamMember[];
  onClose: () => void;
  /** The money is registered; refresh whatever shows the order. */
  onCharged: (result: ChargeResult) => void;
}
