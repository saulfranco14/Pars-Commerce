import type { FollowUpList, GrowthLead, LeadBoard, LeadFilters, LeadView } from "@/features/growth/interfaces/lead";
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

export interface TodayCardProps {
  board?: LeadBoard;
  onList: (list: FollowUpList) => void;
}

export interface SectionCardItem {
  value: LeadView;
  label: string;
  /** Desktop only: one line under the label. */
  hint: string;
  count?: string;
  /** Red badge: something is overdue there. */
  alert?: boolean;
}

export interface SectionCardsProps {
  items: SectionCardItem[];
  active: LeadView;
  onSelect: (value: LeadView) => void;
}

/** What the animated section icons expose (@animateicons/react). */
export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface FollowUpViewProps {
  board?: LeadBoard;
  error?: unknown;
  isLoading: boolean;
  /** A new filter or search is loading: the current list dims until it lands. */
  pending: boolean;
  list: FollowUpList;
  /** With a search, counts come from what was found, not from the stage totals. */
  searching: boolean;
  showOwner: boolean;
  viewerId: string | null;
  onList: (list: FollowUpList) => void;
  /** Opening one prospect starts «modo fila» over the list it came from. */
  onOpen: (leads: GrowthLead[]) => void;
}

export interface FollowUpGroupProps {
  tone: "danger" | "warning" | "neutral";
  title: string;
  total: number;
  hint: string;
  leads: GrowthLead[];
  now: Date;
  showOwner: boolean;
  viewerId: string | null;
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

/** Groups the person opened or closed today, by key; the rest follow their default. */
export type AccordionOverrides = Record<string, boolean>;

export interface FollowUpRowProps {
  lead: GrowthLead;
  now: Date;
  showOwner: boolean;
  viewerId: string | null;
  onOpen: () => void;
}

export interface StageSheetProps {
  isOpen: boolean;
  active: FollowUpList;
  counts: Record<FollowUpList, number>;
  onClose: () => void;
  onPick: (list: FollowUpList) => void;
}

export interface ProspectsActionBarProps {
  onAdd: () => void;
  children: React.ReactNode;
}
