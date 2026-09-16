/* eslint-disable @typescript-eslint/no-explicit-any -- assisted tables ship in the paired migration. */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requirePlatformAdmin } from "@/app/api/platform/_lib";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAssistedOnboardingEmail } from "@/lib/assistedOnboardingEmail";
import { getAppUrl } from "@/lib/env/appUrl";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { id } = await params;
  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: onboarding, error } = await admin.from("assisted_onboardings").select("*").eq("id", id).maybeSingle();
  if (error || !onboarding) return NextResponse.json({ error: "Alta asistida no encontrada." }, { status: 404 });
  const row = onboarding as { owner_email: string; owner_name: string | null; owner_user_id: string; tenant_id: string | null };
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "invite", email: row.owner_email, options: { redirectTo: `${getAppUrl()}/login` } });
  if (linkError || !link.properties?.action_link) return NextResponse.json({ error: linkError?.message ?? "No pudimos generar un nuevo acceso." }, { status: 400 });
  let emailDelivery: "sent" | "failed" = "sent";
  try { await sendAssistedOnboardingEmail({ email: row.owner_email, ownerName: row.owner_name ?? "", businessName: "tu negocio", invitationUrl: link.properties.action_link }); } catch { emailDelivery = "failed"; }
  await admin.from("assisted_onboardings").update({ invitation_sent_at: new Date().toISOString(), status: "invited" }).eq("id", id);
  await admin.from("assisted_onboarding_events").insert({ onboarding_id: id, actor_id: gate.user.id, event_type: "invitation_resent", metadata: { email_delivery: emailDelivery } });
  return NextResponse.json({ invitation_url: link.properties.action_link, email_delivery: emailDelivery });
}
