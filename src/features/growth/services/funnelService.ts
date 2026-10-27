import { internalError } from "@/features/growth/services/growthDb";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { FunnelReport } from "@/features/growth/interfaces/funnel";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export async function getFunnel(db: GrowthDb, days: number): Promise<ServiceResult<FunnelReport>> {
  const span = Math.min(Math.max(Math.round(days) || 7, 1), 365);
  const to = new Date();
  const from = new Date(to.getTime() - span * 86_400_000);
  const { data, error } = await db.rpc("growth_funnel", { p_from: from.toISOString(), p_to: to.toISOString() });
  if (error) return internalError(error.message);
  return { ok: true, data: { days: span, ...(data as Omit<FunnelReport, "days">) } };
}
