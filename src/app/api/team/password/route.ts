import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { setStaffPassword } from "@/features/equipo/services/teamAccountService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

// POST /api/team/password — the business sets a new password for a staff
// account it created.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { membership_id, password } = (await request.json().catch(() => ({}))) as {
    membership_id?: string;
    password?: string;
  };
  if (!membership_id) {
    return NextResponse.json({ error: "membership_id es requerido" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id, user_id")
    .eq("id", membership_id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Esa persona no está en el equipo." }, { status: 404 });
  }

  if (!(await requirePermission(user.id, membership.tenant_id, "team.write"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (membership.user_id === user.id) {
    return NextResponse.json(
      { error: "Tu propia contraseña se cambia desde tu perfil." },
      { status: 409 },
    );
  }

  const result = await setStaffPassword(admin, {
    tenantId: membership.tenant_id,
    membershipId: membership_id,
    password: password ?? "",
  });
  if (!result.ok) return serviceErrorToResponse(result.error);

  await admin.from("platform_activity_events" as never).insert({
    tenant_id: membership.tenant_id,
    actor_id: user.id,
    action: "team.password_set",
    entity_type: "tenant_membership",
    entity_id: membership_id,
    payload: { target_user_id: result.data.userId },
  } as never);

  return NextResponse.json({ username: result.data.username });
}
