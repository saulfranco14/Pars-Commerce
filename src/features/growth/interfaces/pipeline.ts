import type { StageAction } from "@/features/growth/constants/leadPipeline";
import type { FollowUpAction, FollowUpInput, GrowthLead, LeadFilters, LeadStage } from "@/features/growth/interfaces/lead";

export interface PipelineStageProps {
  stage: LeadStage;
}

export interface NextStepCardProps {
  lead: GrowthLead;
  busy: boolean;
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
}

export interface FollowUpViewProps {
  filters: LeadFilters;
}
