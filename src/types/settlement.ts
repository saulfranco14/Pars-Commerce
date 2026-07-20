/** DTOs de la respuesta de los endpoints de liquidación (settlement). */

export type SettlementCycle =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

export type SettlementStatus =
  | "open"
  | "closed"
  | "transfer_pending"
  | "transfer_confirmed"
  | "disputed";

export interface Settlement {
  id: string;
  tenant_id: string;
  cycle_type: SettlementCycle;
  period_start: string;
  period_end: string;
  gross_mp_amount: number;
  net_mp_amount: number;
  platform_commission: number;
  amount_to_transfer: number;
  status: SettlementStatus;
  transfer_reference: string | null;
  transfer_note: string | null;
  transfer_proof_url: string | null;
  transfer_confirmed_at: string | null;
  created_at: string;
}

export interface SettlementsResponse {
  count: number;
  summary: {
    pending_to_receive: number;
    confirmed_received: number;
  };
  settlements: Settlement[];
}

export interface SettlementConfig {
  tenant_id: string;
  cycle_type: SettlementCycle;
  custom_cycle_days: number | null;
  commission_override: number | null;
  last_settled_at: string | null;
}

export interface CyclePreviewRow {
  cycle: SettlementCycle;
  commissionPercent: number | null;
  amountToTransfer: number | null;
}

export interface SettlementConfigResponse {
  config: SettlementConfig;
  preview: CyclePreviewRow[];
  preview_basis: number;
}
