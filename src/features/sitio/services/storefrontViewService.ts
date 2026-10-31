import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BOT = /bot|crawl|spider|slurp|facebookexternalhit|whatsapp|telegrambot|preview|headless|lighthouse/i;

/**
 * One anonymous visitor per store and day: a hash of IP, browser and day with a server secret.
 * No cookie and nothing personal is stored; a new day is a new hash.
 */
export function visitorHash(input: { ip: string; userAgent: string; tenantId: string; day: string }): string {
  const salt = process.env.STOREFRONT_VIEW_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || "tlaco";
  return createHash("sha256").update(`${salt}|${input.tenantId}|${input.day}|${input.ip}|${input.userAgent}`).digest("hex").slice(0, 40);
}

export function isBot(userAgent: string): boolean {
  return !userAgent || BOT.test(userAgent);
}

/** Counts a page view of a published store; previews and link unfurls are ignored by the caller. */
export async function trackStorefrontView(admin: SupabaseClient, input: { tenantId: string; ip: string; userAgent: string }): Promise<boolean> {
  if (isBot(input.userAgent)) return false;
  const { data: tenant } = await admin.from("tenants").select("id").eq("id", input.tenantId).eq("public_store_enabled", true).maybeSingle();
  if (!tenant) return false;
  const day = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City" }).format(new Date());
  const { error } = await admin.rpc("track_storefront_view" as never, {
    p_tenant_id: input.tenantId,
    p_visitor_hash: visitorHash({ ...input, day }),
  } as never);
  return !error;
}
