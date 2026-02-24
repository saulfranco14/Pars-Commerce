export interface AddItemModalProps {
  tenantId: string;
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onAdded: () => void;
}
