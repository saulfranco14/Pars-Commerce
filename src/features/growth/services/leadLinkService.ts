import { randomBytes } from "crypto";

import { hashPreviewToken } from "@/features/preview/previewLinks";
import { isLeadLinkToken, leadLinkSlug } from "@/features/growth/helpers/leadLinkToken";
import { getPublicAppUrl } from "@/lib/env/appUrl";
import { deriveKey, open, seal } from "@/lib/crypto/secretBox";

import type { GrowthDb } from "@/features/growth/services/growthDb";

export const LEAD_LINK_DAYS = 60;
/** A link this close to expiring is not handed out again. */
const REUSE_MIN_DAYS = 7;

/** Without a secret the link is not kept, and each message mints a new one as before. */
function linkKey(): Buffer | null {
  const secret = process.env.GROWTH_LINK_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return secret && secret.length >= 32 ? deriveKey(secret, "growth-para-link") : null;
}

export async function createLeadLink(
  db: GrowthDb,
  input: { leadId: string; purpose: "para" | "baja"; channel: string; templateId?: string | null; businessName?: string },
): Promise<string> {
  // A link that names the business reads as made for them; 12 random characters (72 bits) keep it unguessable.
  const slug = input.purpose === "para" && input.businessName ? leadLinkSlug(input.businessName) : "";
  const token = slug ? `${slug}-${randomBytes(9).toString("base64url")}` : randomBytes(32).toString("base64url");
  const key = input.purpose === "para" ? linkKey() : null;
  const { error } = await db.from("growth_lead_links").insert({
    lead_id: input.leadId,
    token_hash: hashPreviewToken(token),
    token_cipher: key ? seal(token, key) : null,
    purpose: input.purpose,
    channel: input.channel,
    template_id: input.templateId ?? null,
    expires_at: new Date(Date.now() + LEAD_LINK_DAYS * 86_400_000).toISOString(),
  });
  if (error) throw new Error(error.message);
  return token;
}

/** The lead's current "Para ti" link, so every message and every draft points to the same page. */
export async function ensureParaLink(
  db: GrowthDb,
  input: { leadId: string; channel: string; templateId?: string | null; businessName: string },
): Promise<string> {
  const key = linkKey();
  if (key) {
    const { data } = await db
      .from("growth_lead_links")
      .select("id, token_cipher")
      .eq("lead_id", input.leadId)
      .eq("purpose", "para")
      .is("revoked_at", null)
      .not("token_cipher", "is", null)
      .gt("expires_at", new Date(Date.now() + REUSE_MIN_DAYS * 86_400_000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.token_cipher) {
      try {
        const token = open(data.token_cipher as string, key);
        // Sends without an explicit template (Telegram cards) are credited to the latest one drafted.
        if (input.templateId) await db.from("growth_lead_links").update({ template_id: input.templateId }).eq("id", data.id);
        return token;
      } catch {
        // Sealed with another secret (rotated): mint a fresh one below.
      }
    }
  }
  return createLeadLink(db, { leadId: input.leadId, purpose: "para", channel: input.channel, templateId: input.templateId, businessName: input.businessName });
}

export function leadLinkUrl(token: string, purpose: "para" | "baja"): string {
  return `${getPublicAppUrl()}/${purpose}/${token}`;
}

export async function findLinkLead(db: GrowthDb, token: string, purpose: "para" | "baja"): Promise<{ leadId: string; linkId: string } | null> {
  if (!isLeadLinkToken(token)) return null;
  const { data } = await db
    .from("growth_lead_links")
    .select("id, lead_id, expires_at, revoked_at")
    .eq("token_hash", hashPreviewToken(token))
    .eq("purpose", purpose)
    .maybeSingle();
  if (!data || data.revoked_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
  return { leadId: data.lead_id as string, linkId: data.id as string };
}
