import type { TeamMemberOption } from "./orderDetail";

export interface AssignBeforePaidModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assignToId: string, paymentMethod: string) => Promise<void>;
  team: TeamMemberOption[];
  loading?: boolean;
}

export interface ConfirmPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (paymentMethod: string) => Promise<void>;
  total: number;
  loading?: boolean;
}

export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (fixedAmount: number) => Promise<void>;
  onRemove: () => Promise<void>;
  subtotal: number;
  currentDiscount: number;
  loading: boolean;
}
