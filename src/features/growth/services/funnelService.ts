import { internalError } from "@/features/growth/services/growthDb";
import { memberNames } from "@/features/growth/services/memberService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { FunnelReport } from "@/features/growth/interfaces/funnel";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export async function getFunnel(db: GrowthDb, workspaceId: string, days: number): Promise<ServiceResult<FunnelReport>> {
  const span = Math.min(Math.max(Math.round(days) || 7, 1), 365);
  const to = new Date();
  const from = new Date(to.getTime() - span * 86_400_000);
  const { data, error } = await db.rpc("growth_funnel", { p_from: from.toISOString(), p_to: to.toISOString(), p_workspace_id: workspaceId });
  if (error) return internalError(error.message);
  const report = data as Omit<FunnelReport, "days">;
  const names = await memberNames(db, workspaceId, (report.by_member ?? []).map((row) => row.user_id));
  return {
    ok: true,
    data: {
      days: span,
      ...report,
      by_giro: report.by_giro ?? [],
      by_member: (report.by_member ?? []).map((row) => ({ ...row, name: names[row.user_id] ?? "Alguien del equipo" })),
    },
  };
}
