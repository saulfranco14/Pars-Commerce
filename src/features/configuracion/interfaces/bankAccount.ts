export interface TenantPaymentMethod {
  id: string;
  tenant_id: string;
  kind: "bank_transfer" | "cash";
  label: string | null;
  bank_name: string | null;
  account_holder: string | null;
  clabe: string | null;
  account_number: string | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateBankAccountPayload {
  tenant_id: string;
  kind: "bank_transfer" | "cash";
  label: string;
  bank_name: string;
  account_holder: string;
  clabe: string;
  account_number?: string;
  is_active?: boolean;
  display_order?: number;
}

export interface UpdateBankAccountPayload {
  id: string;
  tenant_id: string;
  kind?: "bank_transfer" | "cash";
  label?: string | null;
  bank_name?: string | null;
  account_holder?: string | null;
  clabe?: string | null;
  account_number?: string | null;
  is_active?: boolean;
  display_order?: number;
}
