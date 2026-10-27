import { randomBytes } from "crypto";

import { hashPreviewToken } from "@/features/preview/previewLinks";
import { getPublicAppUrl } from "@/lib/env/appUrl";

import type { GrowthDb } from "@/features/growth/services/growthDb";

export const LEAD_LINK_DAYS = 60;

export async function createLeadLink(
  db: GrowthDb,
  input: { leadId: string; purpose: "para" | "baja"; channel: string; templateId?: string | null },
): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  const { error } = await db.from("growth_lead_links").insert({
    lead_id: input.leadId,
    token_hash: hashPreviewToken(token),
    purpose: input.purpose,
    channel: input.channel,
    template_id: input.templateId ?? null,
    expires_at: new Date(Date.now() + LEAD_LINK_DAYS * 86_400_000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

export function leadLinkUrl(token: string, purpose: "para" | "baja"): string {
  return `${getPublicAppUrl()}/${purpose}/${token}`;
}

export async function findLinkLead(db: GrowthDb, token: string, purpose: "para" | "baja"): Promise<{ leadId: string; linkId: string } | null> {
  if (token.length < 32) return null;
  const { data } = await db
    .from("growth_lead_links")
    .select("id, lead_id, expires_at, revoked_at")
    .eq("token_hash", hashPreviewToken(token))
    .eq("purpose", purpose)
    .maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
  return { leadId: data.lead_id as string, linkId: data.id as string };
}
