import type { TeamMemberOption } from "./teamMemberOption";
import type { SalesCommission, CommissionPayment } from "@/types/sales";

export interface VentasPagosTabProps {
  teamMembers: TeamMemberOption[];
  pendingCommissions: SalesCommission[];
  payments: CommissionPayment[];
  loading: boolean;
  actionLoading: boolean;
  onGeneratePayment: (userId: string) => void;
  onEditPayment: (p: CommissionPayment) => void;
  onPayPayment: (p: CommissionPayment) => void;
}
