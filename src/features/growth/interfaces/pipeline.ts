import type { FollowUpAction, FollowUpInput, GrowthLead, LeadStage } from "@/features/growth/interfaces/lead";

export interface PipelineStageProps {
  stage: LeadStage;
}

export interface FollowUpSheetProps {
  action: FollowUpAction | null;
  businessName: string;
  busy: boolean;
  onClose: () => void;
  onSubmit: (input: FollowUpInput) => Promise<boolean>;
}

export interface BoardLeadCardProps {
  lead: GrowthLead;
  now: Date;
  /** Coordinators looking at the whole team see whose each card is. */
  showOwner?: boolean;
}

export type BoardLayout = "tablero" | "lista";

