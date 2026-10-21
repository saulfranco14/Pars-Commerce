export interface TrackedOrderBankAccount {
  bank_name: string | null;
  account_holder: string | null;
  clabe: string | null;
  account_number: string | null;
}

export interface TrackedOrderPaySheetProps {
  open: boolean;
  token: string;
  total: number;
  /** Shown when the customer picks transfer; null hides that option. */
  bankAccount: TrackedOrderBankAccount | null;
  onClose: () => void;
  onDeclared: () => void;
}
