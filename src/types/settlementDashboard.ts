/** DTOs del tablero de tesorería de plataforma (super admin). */

export interface SettlementStatusSummary {
  status: string;
  count: number;
  total_to_transfer: number;
}

export interface TenantOwed {
  tenant_id: string;
  open_settlements: number;
  total_to_transfer: number;
}

export interface PlatformDashboard {
  by_status: SettlementStatusSummary[];
  total_outstanding: number;
  commission_confirmed: number;
  owed_by_tenant: TenantOwed[];
  needs_action: number;
  disputed: number;
}
