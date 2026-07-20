import { apiFetch } from "@/services/apiFetch";

import type { SplitMode } from "@/features/qr/interfaces/splitBill";

export async function createSplitGroups(payload: {
  order_id: string;
  mode: SplitMode;
  people_count?: number;
  groups?: Array<{ label: string; order_item_ids: string[] }>;
}) {
  return apiFetch(`/api/qr/table/${payload.order_id}/split`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
