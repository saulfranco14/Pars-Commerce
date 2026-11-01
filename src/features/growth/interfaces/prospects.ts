import type { LeadFilters } from "@/features/growth/interfaces/lead";
import type { GrowthMember } from "@/features/growth/interfaces/member";

export interface ProspectsToolbarProps {
  filters: LeadFilters;
  search: string;
  onSearch: (value: string) => void;
  onChange: (patch: Partial<LeadFilters>) => void;
  onClear: () => void;
  isCoordinator: boolean;
  /** Teammates for «Quién lo trabaja», without the person looking. */
  people: GrowthMember[];
}

export interface ProspectingGuideProps {
  isOpen: boolean;
  onClose: () => void;
}
