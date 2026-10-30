/* eslint-disable @typescript-eslint/no-explicit-any -- assisted tables ship outside the generated types. */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

import { sendAssistedOnboardingEmail } from "@/lib/assistedOnboardingEmail";
import { getAppUrl } from "@/lib/env/appUrl";
import { createPreviewLink } from "@/features/preview/previewLinks";

import type { AssistedOnboardingInput, AssistedOnboardingResult } from "@/features/onboarding/interfaces/assistedOnboarding";
import type { ServiceResult } from "@/features/qr/services/tablePaymentService";

export function normalizeSlug(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** "tacos-el-guero" is taken → "tacos-el-guero-2", and so on. */
async function freeSlug(admin: SupabaseClient<any>, base: string): Promise<string> {
  for (let attempt = 1; attempt <= 20; attempt++) {
    const slug = attempt === 1 ? base : `${base}-${attempt}`;
    const { data } = await admin.from("tenants").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${randomUUID().slice(0, 6)}`;
}

/**
 * Creates the business for its owner: invites the owner (or reuses their account), provisions the tenant
 * with its starter catalog, emails the invitation and opens a 72 h preview link.
 * Used by Plataforma → Negocios and by the prospecting team from a prospect.
 */
export async function provisionAssistedOnboarding(admin: SupabaseClient<any>, actorId: string, input: AssistedOnboardingInput): Promise<ServiceResult<AssistedOnboardingResult>> {
  const name = input.name?.trim();
  const email = input.owner_email?.trim().toLowerCase();
  const baseSlug = normalizeSlug(input.slug || name || "");
  if (!name || !email || !baseSlug) return { ok: false, error: { code: "validation", message: "Nombre, slug y correo del propietario son requeridos." } };
  const slug = input.slug ? baseSlug : await freeSlug(admin, baseSlug);

  let ownerId: string | null = null;
  let invitationUrl: string | null = null;
  const { data: profile } = await admin.from("profiles").select("id").eq("email", email).maybeSingle();
  if (profile?.id) {
    ownerId = profile.id;
    invitationUrl = `${getAppUrl()}/login`;
  } else {
    const { data, error } = await admin.auth.admin.generateLink({
      type: "invite",
      email,
      options: { data: { display_name: input.owner_name?.trim() || email.split("@")[0] }, redirectTo: `${getAppUrl()}/login` },
    });
    if (error || !data.user) return { ok: false, error: { code: "validation", message: error?.message ?? "No pudimos preparar el acceso del propietario." } };
    ownerId = data.user.id;
    invitationUrl = data.properties?.action_link ?? null;
  }
  if (!ownerId) return { ok: false, error: { code: "internal", message: "No pudimos resolver el propietario." } };

  const key = input.provisioning_key ?? randomUUID();
  const { data: provisioned, error: provisionError } = await admin.rpc("provision_assisted_tenant" as never, {
    p_provisioning_key: key,
    p_owner_user_id: ownerId,
    p_owner_email: email,
    p_owner_phone: input.owner_phone?.trim() ?? null,
    p_owner_name: input.owner_name?.trim() ?? null,
    p_name: name,
    p_slug: slug,
    p_business_type: input.business_type?.trim() || "otro",
    p_catalog_template_key: input.catalog_template_key?.trim() || null,
    p_site_template_id: input.site_template_id || null,
    p_billing_mode: input.billing_mode ?? "configuration_limited",
    p_actor_id: actorId,
    p_notes: input.notes?.trim() ?? null,
  } as never) as { data: unknown; error: { message: string } | null };
  if (provisionError) return { ok: false, error: { code: "internal", message: provisionError.message } };
  const result = (Array.isArray(provisioned) ? provisioned[0] : provisioned) as { onboarding_id?: string; tenant_id?: string; tenant_slug?: string } | null;
  if (result?.tenant_id && input.catalog_template_key) {
    await admin.from("tenants").update({
      catalog_review_status: "pending",
      public_store_enabled: true,
      accepting_orders: false,
      updated_at: new Date().toISOString(),
    } as never).eq("id", result.tenant_id);
  }

  let emailDelivery: AssistedOnboardingResult["email_delivery"] = profile?.id ? "not_needed" : "sent";
  if (!profile?.id && invitationUrl) {
    try {
      await sendAssistedOnboardingEmail({ email, ownerName: input.owner_name?.trim() || "", businessName: name, invitationUrl });
    } catch {
      emailDelivery = "failed";
    }
  }
  await admin.from("assisted_onboarding_events").insert({
    onboarding_id: result?.onboarding_id,
    actor_id: actorId,
    event_type: "invitation_generated",
    metadata: { email_delivery: emailDelivery, existing_user: Boolean(profile?.id) },
  });
  const preview = result?.tenant_id ? await createPreviewLink(admin, { tenantId: result.tenant_id, createdBy: actorId, expiresInHours: 72 }) : null;
  return {
    ok: true,
    data: {
      onboarding_id: result?.onboarding_id ?? null,
      tenant_id: result?.tenant_id ?? null,
      tenant_slug: result?.tenant_slug ?? null,
      provisioning_key: key,
      invitation_url: invitationUrl,
      preview_url: preview ? `${getAppUrl()}/vista-previa/${preview.token}` : null,
      preview_expires_at: preview?.expiresAt ?? null,
      email_delivery: emailDelivery,
    },
  };
}
