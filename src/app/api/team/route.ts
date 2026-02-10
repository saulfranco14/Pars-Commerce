import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

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

  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select("id, user_id, role_id")
    .eq("tenant_id", tenantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const userIds = [...new Set((memberships ?? []).map((m) => m.user_id))];
  const roleIds = [...new Set((memberships ?? []).map((m) => m.role_id))];

  const admin = createAdminClient();
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

  const list = (memberships ?? []).map((m) => {
    const profile = profileMap.get(m.user_id) ?? null;
    return {
      id: m.id,
      user_id: m.user_id,
      role_id: m.role_id,
      role_name: roleMap.get(m.role_id) ?? "",
      display_name: profile?.display_name ?? "",
      email: profile?.email ?? "",
    };
  });

  return NextResponse.json(list);
}

async function requireTeamWrite(
  _supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tenantId: string
) {
  const admin = createAdminClient();
  const { data: m } = await admin
    .from("tenant_memberships")
    .select("role_id")
    .eq("user_id", userId)
    .eq("tenant_id", tenantId)
    .single();
  if (!m) return false;
  const { data: role } = await admin
    .from("tenant_roles")
    .select("name, permissions")
    .eq("id", m.role_id)
    .single();
  const perms = role?.permissions as string[] | undefined;
  return (
    role?.name === "owner" ||
    (Array.isArray(perms) && perms.includes("team.write"))
  );
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

  const { data: membership, error } = await admin
    .from("tenant_memberships")
    .insert({
      tenant_id,
      user_id: targetUserId,
      role_id,
      accepted_at: new Date().toISOString(),
    })
    .select("id, user_id, role_id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
  const { membership_id, role_id } = body as {
    membership_id: string;
    role_id: string;
  };

  if (!membership_id || !role_id) {
    return NextResponse.json(
      { error: "membership_id and role_id are required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("tenant_id")
    .eq("id", membership_id)
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

  const { error: updateError } = await admin
    .from("tenant_memberships")
    .update({ role_id, updated_at: new Date().toISOString() })
    .eq("id", membership_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

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

  return NextResponse.json({ success: true });
}
