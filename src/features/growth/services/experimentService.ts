import { internalError } from "@/features/growth/services/growthDb";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ParaDesignStats } from "@/features/growth/interfaces/para";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

/** Time on page, store reached and «Activar» taps per «Para ti» design, for the people who opened it. */
export async function paraDesignStats(db: GrowthDb, workspaceId: string): Promise<ServiceResult<ParaDesignStats[]>> {
  const { data, error } = await db.rpc("growth_para_design_stats", { p_workspace_id: workspaceId });
  if (error) return internalError(error.message);
  return { ok: true, data: (data ?? []) as ParaDesignStats[] };
}
