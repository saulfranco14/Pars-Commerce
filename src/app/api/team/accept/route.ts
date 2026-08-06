import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

/** Explicit acceptance for an already authenticated, email-verified invitee. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.email_confirmed_at) {
    return NextResponse.json({ error: "Confirma tu correo antes de aceptar la invitación" }, { status: 403 });
  }
  const { tenant_id } = await request.json() as { tenant_id?: string };
  if (!tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("id, invitation_expires_at")
    .eq("tenant_id", tenant_id)
    .eq("user_id", user.id)
    .eq("status", "invited")
    .maybeSingle() as unknown as { data: { id: string; invitation_expires_at: string | null } | null };
  if (!membership) return NextResponse.json({ error: "Invitación no encontrada" }, { status: 404 });
  if (membership.invitation_expires_at && new Date(membership.invitation_expires_at) < new Date()) {
    return NextResponse.json({ error: "La invitación venció. Pide una nueva al negocio." }, { status: 410 });
  }
  const now = new Date().toISOString();
  const { error } = await admin.from("tenant_memberships")
    .update({ status: "active", accepted_at: now, updated_at: now } as never)
    .eq("id", membership.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("platform_activity_events" as never).insert({
    tenant_id,
    actor_id: user.id,
    action: "team.invitation_accepted",
    entity_type: "tenant_membership",
    entity_id: membership.id,
  } as never);
  return NextResponse.json({ success: true });
}
