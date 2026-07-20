import type { QrKind } from "@/features/qr/constants/qrKinds";

export interface QrCode {
  id: string;
  tenant_id: string;
  token: string;
  kind: QrKind;
  label: string;
  table_capacity: number | null;
  preset_amount: number | null;
  preset_concept: string | null;
  allow_amount_override: boolean;
  print_template: string | null;
  metadata: Record<string, unknown> | null;
  is_active: boolean;
  archived_at: string | null;
  current_order_id: string | null;
  created_at: string;
  updated_at: string;
}
