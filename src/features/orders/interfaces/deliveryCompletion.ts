import type { ChargeTeamMember } from "@/features/orders/interfaces/chargeSheet";

export interface DeliveryCompletionSheetProps {
  open: boolean;
  busy?: boolean;
  onClose: () => void;
  /** `assignee` is who attended, picked here only when nobody had the order. */
  onSubmit: (photo: File, note: string, assignee: string | null) => Promise<void>;
  /** Who can be picked; empty hides the choice (the person can't assign). */
  team?: ChargeTeamMember[];
  assignedTo?: string | null;
}
