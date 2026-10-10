/* eslint-disable @typescript-eslint/no-explicit-any -- preview-link tables ship before generated database types refresh. */
import { createHash, randomBytes } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export function hashPreviewToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createPreviewLink(client: unknown, input: { tenantId: string; createdBy: string; expiresInHours?: number }) {
  const admin = client as SupabaseClient<any>;
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + (input.expiresInHours ?? 72) * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin.from("tenant_preview_links").insert({
    tenant_id: input.tenantId,
    created_by: input.createdBy,
    token_hash: hashPreviewToken(token),
    expires_at: expiresAt,
  }).select("id, expires_at").single();
  if (error) throw new Error(error.message);
  return { id: data.id as string, token, expiresAt: data.expires_at as string };
}
