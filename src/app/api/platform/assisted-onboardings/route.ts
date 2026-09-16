/* eslint-disable @typescript-eslint/no-explicit-any -- assisted tables ship in the paired migration. */
import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/app/api/platform/_lib";
import { sendAssistedOnboardingEmail } from "@/lib/assistedOnboardingEmail";
import { getAppUrl } from "@/lib/env/appUrl";
import { createAdminClient } from "@/lib/supabase/admin";

type AssistedPayload = {
  name?: string;
  slug?: string;
  business_type?: string;
  catalog_template_key?: string | null;
  site_template_id?: string | null;
  owner_name?: string;
  owner_email?: string;
  owner_phone?: string;
  billing_mode?: "configuration_limited" | "contracted" | "courtesy";
  notes?: string;
  provisioning_key?: string;
};

function normalizeSlug(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await request.json() as AssistedPayload;
  const name = body.name?.trim();
  const email = body.owner_email?.trim().toLowerCase();
  const slug = body.slug ? normalizeSlug(body.slug) : normalizeSlug(name ?? "");
  if (!name || !email || !slug) return NextResponse.json({ error: "Nombre, slug y correo del propietario son requeridos." }, { status: 400 });

  const admin = createAdminClient() as unknown as SupabaseClient<any>;
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
      options: { data: { display_name: body.owner_name?.trim() || email.split("@")[0] }, redirectTo: `${getAppUrl()}/login` },
    });
    if (error || !data.user) return NextResponse.json({ error: error?.message ?? "No pudimos preparar el acceso del propietario." }, { status: 400 });
    ownerId = data.user.id;
    invitationUrl = data.properties?.action_link ?? null;
  }
  if (!ownerId) return NextResponse.json({ error: "No pudimos resolver el propietario." }, { status: 500 });

  const key = body.provisioning_key ?? randomUUID();
  const { data: provisioned, error: provisionError } = await admin.rpc("provision_assisted_tenant" as never, {
    p_provisioning_key: key,
    p_owner_user_id: ownerId,
    p_owner_email: email,
    p_owner_phone: body.owner_phone?.trim() ?? null,
    p_owner_name: body.owner_name?.trim() ?? null,
    p_name: name,
    p_slug: slug,
    p_business_type: body.business_type?.trim() || "otro",
    p_catalog_template_key: body.catalog_template_key?.trim() || null,
    p_site_template_id: body.site_template_id || null,
    p_billing_mode: body.billing_mode ?? "configuration_limited",
    p_actor_id: gate.user.id,
    p_notes: body.notes?.trim() ?? null,
  } as never) as { data: unknown; error: { message: string } | null };
  if (provisionError) return NextResponse.json({ error: provisionError.message }, { status: 500 });
  const result = (Array.isArray(provisioned) ? provisioned[0] : provisioned) as { onboarding_id?: string; tenant_id?: string; tenant_slug?: string } | null;

  let emailDelivery: "sent" | "failed" | "not_needed" = profile?.id ? "not_needed" : "sent";
  if (!profile?.id && invitationUrl) {
    try {
      await sendAssistedOnboardingEmail({ email, ownerName: body.owner_name?.trim() || "", businessName: name, invitationUrl });
    } catch {
      emailDelivery = "failed";
    }
  }
  await admin.from("assisted_onboarding_events").insert({
    onboarding_id: result?.onboarding_id,
    actor_id: gate.user.id,
    event_type: "invitation_generated",
    metadata: { email_delivery: emailDelivery, existing_user: Boolean(profile?.id) },
  });
  return NextResponse.json({ ...result, provisioning_key: key, invitation_url: invitationUrl, email_delivery: emailDelivery }, { status: 201 });
}

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const { data, error } = await admin.from("assisted_onboardings").select("*").order("created_at", { ascending: false }).limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
