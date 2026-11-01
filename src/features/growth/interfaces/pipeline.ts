import type { FollowUpAction, FollowUpInput, GrowthLead, LeadFilters, LeadStage } from "@/features/growth/interfaces/lead";

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
