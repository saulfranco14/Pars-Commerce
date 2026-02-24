import type { TabView } from "@/features/ventas/constants/tabs";
import type { TeamMemberOption } from "./teamMemberOption";

export interface VentasFiltersProps {
  activeTab: TabView;
  filtersOpen: boolean;
  setFiltersOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  userFilter: string;
  setUserFilter: (v: string) => void;
  paidFilter: string;
  setPaidFilter: (v: string) => void;
  dateFrom: string;
  setDateFrom: (v: string) => void;
  dateTo: string;
  setDateTo: (v: string) => void;
  periodType: "day" | "week" | "month";
  setPeriodType: (v: "day" | "week" | "month") => void;
  selectedUser: string;
  setSelectedUser: (v: string) => void;
  paymentStatus: string;
  setPaymentStatus: (v: string) => void;
  teamMembers: TeamMemberOption[];
}
