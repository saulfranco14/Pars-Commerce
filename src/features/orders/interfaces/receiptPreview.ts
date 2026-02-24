import type { TenantAddress } from "@/types/database";
import type { TicketSettings } from "@/types/ticketSettings";
import type { OrderDetail, OrderItem } from "./orderDetail";

export interface ReceiptPreviewProps {
  order: OrderDetail;
  businessName: string;
  items: OrderItem[];
  businessAddress?: TenantAddress | null;
  ticketOptions?: TicketSettings | null;
  logoUrl?: string | null;
}
