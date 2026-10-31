import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { NextAction } from "@/features/growth/interfaces/whatsapp";

/** Which message fits now and the facts behind it; the decision lives in growth_lead_next_action. */
export async function nextAction(db: GrowthDb, leadId: string): Promise<NextAction | null> {
  const { data } = await db.rpc("growth_lead_next_action", { p_lead_id: leadId });
  return (data as NextAction | null) ?? null;
}
