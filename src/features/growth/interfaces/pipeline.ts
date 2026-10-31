import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { FollowUpAction, FollowUpInput, GrowthLead, LeadFilters, LeadStage } from "@/features/growth/interfaces/lead";

export interface PipelineStageProps {
  stage: LeadStage;
}

export interface NextStepCardProps {
  lead: GrowthLead;
  busy: boolean;
  /** Why this step, in plain words (from growth_lead_next_action). */
  reason?: string | null;
  onAction: (action: StageAction) => void;
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

export interface FollowUpViewProps {
  filters: LeadFilters;
  showOwner?: boolean;
}

export type BoardLayout = "tablero" | "lista";

export interface LeadBoardTableProps {
  leads: GrowthLead[];
  now: Date;
  showOwner?: boolean;
}
