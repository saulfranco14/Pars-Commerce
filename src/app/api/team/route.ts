import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth/requirePermission";

type MembershipLifecycle = {
  id: string;
  tenant_id: string;
  user_id: string;
  role_id: string;
  status?: "invited" | "active" | "suspended";
  invited_at?: string | null;
  invitation_expires_at?: string | null;
  suspended_at?: string | null;
  suspension_reason?: string | null;
};

async function audit(
  tenantId: string,
  actorId: string,
  action: string,
  entityId: string,
  payload: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  await admin.from("platform_activity_events" as never).insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action,
    entity_type: "tenant_membership",
    entity_id: entityId,
    payload,
  } as never);
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");

  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const canRead = await requirePermission(user.id, tenantId, "team.read");
  if (!canRead) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();
  const { data: memberships, error } = await admin
    .from("tenant_memberships")
    .select("id, tenant_id, user_id, role_id, status, invited_at, invitation_expires_at, suspended_at, suspension_reason")
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (memberships ?? []) as unknown as MembershipLifecycle[];
  const userIds = [...new Set(rows.map((m) => m.user_id))];
  const roleIds = [...new Set(rows.map((m) => m.role_id))];

  const [profilesRes, rolesRes] = await Promise.all([
    userIds.length > 0
      ? admin
          .from("profiles")
          .select("id, display_name, email")
          .in("id", userIds)
      : { data: [] },
    roleIds.length > 0
      ? supabase.from("tenant_roles").select("id, name").in("id", roleIds)
      : { data: [] },
  ]);

  const profileMap = new Map(
    (profilesRes.data ?? []).map((p) => [
      p.id,
      { display_name: p.display_name, email: p.email },
    ])
  );
  const roleMap = new Map((rolesRes.data ?? []).map((r) => [r.id, r.name]));

  const missingProfileIds = userIds.filter((uid) => {
    const p = profileMap.get(uid);
    return !p || (!p.display_name && !p.email);
  });

  if (missingProfileIds.length > 0) {
    const { data: authData } = await admin.auth.admin.listUsers();
    if (authData?.users) {
      for (const uid of missingProfileIds) {
        const authUser = authData.users.find((u) => u.id === uid);
        if (authUser) {
          const displayName =
            (authUser.user_metadata?.display_name as string) ??
            authUser.email?.split("@")[0] ??
            "";
          const email = authUser.email ?? "";
          profileMap.set(uid, { display_name: displayName, email });

          await admin
            .from("profiles")
            .upsert(
              { id: uid, email, display_name: displayName },
              { onConflict: "id" }
            );
        }
      }
    }
  }

  const list = rows.map((m) => {
    const profile = profileMap.get(m.user_id) ?? null;
    return {
      id: m.id,
      user_id: m.user_id,
      role_id: m.role_id,
      role_name: roleMap.get(m.role_id) ?? "",
      display_name: profile?.display_name ?? "",
      email: profile?.email ?? "",
      status: m.status ?? "active",
      invited_at: m.invited_at ?? null,
      invitation_expires_at: m.invitation_expires_at ?? null,
      suspended_at: m.suspended_at ?? null,
      suspension_reason: m.suspension_reason ?? null,
    };
  });

  return NextResponse.json(list);
}

async function requireTeamWrite(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tenantId: string
) {
  return Boolean(await requirePermission(userId, tenantId, "team.write"));
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { tenant_id, role_id, user_id, email, display_name } = body as {
    tenant_id: string;
    role_id: string;
    user_id?: string;
    email?: string;
    display_name?: string;
  };

  if (!tenant_id || !role_id) {
    return NextResponse.json(
      { error: "tenant_id and role_id are required" },
      { status: 400 }
    );
  }

  const canWrite = await requireTeamWrite(supabase, user.id, tenant_id);
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let targetUserId = user_id;
  const tempPassword: string | null = null;
  let invitedByEmail = false;

  if (!targetUserId && email) {
    const cleanEmail = email.trim().toLowerCase();
    const adminForSearch = createAdminClient();
    const { data: profile } = await adminForSearch
      .from("profiles")
      .select("id")
      .eq("email", cleanEmail)
      .single();

    if (profile) {
      targetUserId = profile.id;
    } else {
      const admin = adminForSearch;
      const { data: authUsers, error: listError } =
        await admin.auth.admin.listUsers();

      if (listError) {
        return NextResponse.json(
          { error: `Error al buscar usuario: ${listError.message}` },
          { status: 500 }
        );
      }

      const authUser = authUsers.users.find(
        (u) => u.email?.toLowerCase() === cleanEmail
      );

      if (authUser) {
        const resolvedName =
          display_name?.trim() ||
          (authUser.user_metadata?.display_name as string) ||
          cleanEmail.split("@")[0];
        const { error: profileError } = await admin.from("profiles").upsert(
          {
            id: authUser.id,
            email: cleanEmail,
            display_name: resolvedName,
          },
          { onConflict: "id" }
        );

        if (profileError) {
          return NextResponse.json(
            {
              error: `El usuario existe pero no se pudo crear su perfil: ${profileError.message}`,
            },
            { status: 500 }
          );
        }

        targetUserId = authUser.id;
      } else {
        const redirectTo =
          process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        // inviteUserByEmail sends the invite email; createUser(email_confirm: false) does not
        const inviteDisplayName =
          display_name?.trim() || cleanEmail.split("@")[0];
        const { data: invitedUser, error: inviteError } =
          await admin.auth.admin.inviteUserByEmail(cleanEmail, {
            data: { display_name: inviteDisplayName },
            redirectTo: `${redirectTo}/login`,
          });

        if (inviteError) {
          return NextResponse.json(
            { error: `Error al enviar invitación: ${inviteError.message}` },
            { status: 500 }
          );
        }

        targetUserId = invitedUser.user.id;

        const { error: profileError } = await admin.from("profiles").upsert(
          {
            id: invitedUser.user.id,
            email: cleanEmail,
            display_name: inviteDisplayName,
          },
          { onConflict: "id" }
        );

        if (profileError) {
          return NextResponse.json(
            {
              error: `Usuario invitado pero falló el perfil: ${profileError.message}`,
            },
            { status: 500 }
          );
        }

        invitedByEmail = true;
      }
    }
  }

  if (!targetUserId) {
    return NextResponse.json(
      { error: "No se pudo identificar o crear al usuario." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenant_id)
    .eq("user_id", targetUserId)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: "User is already a member" },
      { status: 409 }
    );
  }

  const invitedAt = invitedByEmail ? new Date() : null;
  const expiresAt = invitedByEmail ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null;
  const { data: membership, error } = await admin
    .from("tenant_memberships")
    .insert({
      tenant_id,
      user_id: targetUserId,
      role_id,
      invited_at: invitedAt?.toISOString() ?? null,
      invitation_expires_at: expiresAt?.toISOString() ?? null,
      accepted_at: invitedByEmail ? null : new Date().toISOString(),
      status: invitedByEmail ? "invited" : "active",
    })
    .select("id, user_id, role_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await audit(tenant_id, user.id, invitedByEmail ? "team.invited" : "team.added", membership.id, {
    target_user_id: targetUserId,
    role_id,
    invited_by_email: invitedByEmail,
  });

  return NextResponse.json({
    ...membership,
    tempPassword,
    invitedByEmail,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { membership_id, role_id, action, reason } = body as {
    membership_id: string;
    role_id?: string;
    action?: "suspend" | "reactivate";
    reason?: string;
  };

  if (!membership_id || (!role_id && !action)) {
    return NextResponse.json(
      { error: "membership_id and role_id are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: rawMembership } = await admin
    .from("tenant_memberships")
    .select("id, tenant_id, user_id, role_id, status")
    .eq("id", membership_id)
    .single();

  const membership = rawMembership as unknown as MembershipLifecycle | null;
  if (!membership) {
    return NextResponse.json(
      { error: "Membership not found" },
      { status: 404 }
    );
  }

  const canWrite = await requireTeamWrite(
    supabase,
    user.id,
    membership.tenant_id
  );
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: targetRole } = await admin
    .from("tenant_roles")
    .select("name")
    .eq("id", membership.role_id)
    .maybeSingle();
  if (targetRole?.name === "owner" && action) {
    return NextResponse.json({ error: "No se puede suspender al owner" }, { status: 409 });
  }
  if (action === "suspend" && !reason?.trim()) {
    return NextResponse.json({ error: "Indica el motivo de la suspensión" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: now };
  if (role_id) updates.role_id = role_id;
  if (action === "suspend") {
    updates.status = "suspended";
    updates.suspended_at = now;
    updates.suspended_by = user.id;
    updates.suspension_reason = reason!.trim();
  }
  if (action === "reactivate") {
    updates.status = "active";
    updates.suspended_at = null;
    updates.suspended_by = null;
    updates.suspension_reason = null;
  }
  const { error: updateError } = await admin
    .from("tenant_memberships")
    .update(updates as never)
    .eq("id", membership_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  await audit(membership.tenant_id, user.id, action ? `team.${action}d` : "team.role_changed", membership_id, {
    target_user_id: membership.user_id,
    role_id: role_id ?? membership.role_id,
    reason: action === "suspend" ? reason!.trim() : null,
  });
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const membershipId = searchParams.get("membership_id");

  if (!membershipId) {
    return NextResponse.json(
      { error: "membership_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id, role_id")
    .eq("id", membershipId)
    .single();

  if (!membership) {
    return NextResponse.json(
      { error: "Membership not found" },
      { status: 404 }
    );
  }

  const canWrite = await requireTeamWrite(
    supabase,
    user.id,
    membership.tenant_id
  );
  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { data: role } = await admin
    .from("tenant_roles")
    .select("name")
    .eq("id", membership.role_id)
    .single();

  if (role?.name === "owner") {
    return NextResponse.json(
      { error: "Cannot remove the owner" },
      { status: 409 }
    );
  }

  const { error: delError } = await admin
    .from("tenant_memberships")
    .delete()
    .eq("id", membershipId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  await audit(membership.tenant_id, user.id, "team.removed", membershipId, {
    role_id: membership.role_id,
  });

  return NextResponse.json({ success: true });
}
