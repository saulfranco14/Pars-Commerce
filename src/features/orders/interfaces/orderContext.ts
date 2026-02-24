import type { OrderDetail, TeamMemberOption } from "./orderDetail";
import type { TenantAddress } from "@/types/database";
import type { TicketSettings } from "@/types/ticketSettings";

export interface OrderContextType {
  order: OrderDetail | null;
  team: TeamMemberOption[];
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
  assignmentSuccess: boolean;
  tenantSlug: string;
  businessName: string;
  businessAddress: TenantAddress | null;
  ticketOptions: TicketSettings;
  logoUrl: string | null;
  fetchOrder: () => Promise<void>;
  handleStatusChange: (newStatus: string) => Promise<void>;
  handleAssign: (assignToId: string) => Promise<void>;
  handleAssignAndMarkPaid: (assignToId: string, paymentMethod?: string) => Promise<void>;
  handleMarkAsPaidWithMethod: (paymentMethod: string) => Promise<void>;
  handleExpressToPayment: () => Promise<boolean>;
  handleSaveCustomer: (details: { name: string; email: string; phone: string }) => Promise<void>;
  handleRemoveItem: (itemId: string) => Promise<void>;
  handleGeneratePaymentLink: () => Promise<void>;
  handleSaveDiscount: (amount: number) => Promise<void>;
  setError: (msg: string | null) => void;
}
