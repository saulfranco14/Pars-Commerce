import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { GrowthLead, LeadDetail } from "@/features/growth/interfaces/lead";
import type { GrowthMember } from "@/features/growth/interfaces/member";
import type { ComposerOutcome, SentWhatsapp } from "@/features/growth/interfaces/whatsapp";

/** Everything the lead page can do: the pipeline moves plus fixing its data and who works it. */
export type LeadSheetAction = StageAction | "whatsapp" | "phone" | "giro" | "owner";

export interface LeadActionGroup {
  title: string;
  actions: LeadSheetAction[];
}

export interface LeadActionsSheetProps {
  isOpen: boolean;
  busy: boolean;
  groups: LeadActionGroup[];
  onClose: () => void;
  onPick: (action: LeadSheetAction) => void;
}

export interface LeadOwnerSheetProps {
  isOpen: boolean;
  busy: boolean;
  ownerId: string | null;
  actorId: string | null;
  people: GrowthMember[];
  onClose: () => void;
  onSubmit: (ownerId: string | null) => Promise<boolean>;
}

export interface LeadNowCardProps {
  lead: GrowthLead;
  busy: boolean;
  /** Why this step, in plain words (from growth_lead_next_action). */
  reason?: string | null;
  /** The WhatsApp message lives in the card; false when there is no usable number. */
  showMessage: boolean;
  onAction: (action: LeadSheetAction) => void;
  onOpenActions: () => void;
  onOutcome: (outcome: ComposerOutcome, sent?: SentWhatsapp) => Promise<boolean>;
}

export interface LeadMessageProps {
  leadId: string;
  busy: boolean;
  /** Follow-ups to someone who never answered: the AI writes a different one instead of polishing. */
  followUp: boolean;
  shortcuts: React.ReactNode;
  onOpenActions: () => void;
  onOutcome: (outcome: ComposerOutcome, sent?: SentWhatsapp) => Promise<boolean>;
}

export interface LeadActionBarProps {
  onOpenActions: () => void;
  children: React.ReactNode;
}

export interface LeadDataCardProps {
  lead: GrowthLead;
  acquisition: LeadDetail["acquisition"];
  ownerLabel: string;
  canEdit: boolean;
  canReassign: boolean;
  onAction: (action: LeadSheetAction) => void;
}
