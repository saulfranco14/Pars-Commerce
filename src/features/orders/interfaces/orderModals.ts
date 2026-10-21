export interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (fixedAmount: number) => Promise<void>;
  onRemove: () => Promise<void>;
  subtotal: number;
  currentDiscount: number;
  loading: boolean;
}
