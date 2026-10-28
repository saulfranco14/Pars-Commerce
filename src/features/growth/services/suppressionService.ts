import { findLinkLead } from "@/features/growth/services/leadLinkService";
import { recordOutcome } from "@/features/growth/services/leadService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export async function leadForUnsubscribe(db: GrowthDb, token: string): Promise<{ leadId: string; businessName: string; done: boolean } | null> {
  const link = await findLinkLead(db, token, "baja");
  if (!link) return null;
  const { data } = await db.from("growth_leads").select("business_name, stage, drop_reason").eq("id", link.leadId).maybeSingle();
  if (!data) return null;
  return { leadId: link.leadId, businessName: data.business_name as string, done: data.stage === "descartado" && data.drop_reason === "baja" };
}

/** One-click unsubscribe (RFC 8058): suppresses phone and email on every channel. */
export async function unsubscribe(db: GrowthDb, token: string): Promise<ServiceResult<{ businessName: string }>> {
  const lead = await leadForUnsubscribe(db, token);
  if (!lead) return { ok: false, error: { code: "not_found", message: "Este link ya no es válido." } };
  if (!lead.done) {
    const result = await recordOutcome(db, { leadId: lead.leadId, outcome: "unsubscribed", actor: "prospect" });
    if (!result.ok) return result;
  }
  return { ok: true, data: { businessName: lead.businessName } };
}
