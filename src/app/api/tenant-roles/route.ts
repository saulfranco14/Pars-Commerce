import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  createRole,
  deleteRole,
  updateRole,
} from "@/features/equipo/services/tenantRoleService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

async function currentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  return { supabase, user: error ? null : user };
}

const unauthorized = () => NextResponse.json({ error: "Unauthorized" }, { status: 401 });

export async function GET(request: Request) {
  const { supabase, user } = await currentUser();
  if (!user) return unauthorized();

  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  // `permissions` travels to the client: the menu preview and the role
  // description are built from what the role really holds, not its name.
  const { data: roles, error } = await supabase
    .from("tenant_roles")
    .select("id, name, permissions, is_system")
    .eq("tenant_id", tenantId)
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(roles ?? []);
}

// POST { tenant_id, name, permissions } — a role of the business's own.
export async function POST(request: Request) {
  const { user } = await currentUser();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    tenant_id?: string;
    name?: string;
    permissions?: unknown;
  };
  if (!body.tenant_id) {
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const result = await createRole(createAdminClient(), {
    userId: user.id,
    tenantId: body.tenant_id,
    name: body.name ?? "",
    permissions: body.permissions ?? [],
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

// PATCH { tenant_id, role_id, name?, permissions?, reset? }
export async function PATCH(request: Request) {
  const { user } = await currentUser();
  if (!user) return unauthorized();

  const body = (await request.json().catch(() => ({}))) as {
    tenant_id?: string;
    role_id?: string;
    name?: string;
    permissions?: unknown;
    reset?: boolean;
  };
  if (!body.tenant_id || !body.role_id) {
    return NextResponse.json({ error: "tenant_id y role_id son requeridos" }, { status: 400 });
  }

  const result = await updateRole(createAdminClient(), {
    userId: user.id,
    tenantId: body.tenant_id,
    roleId: body.role_id,
    name: body.name,
    permissions: body.permissions,
    reset: body.reset === true,
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}

// DELETE ?tenant_id=&role_id= — only roles of the business's own, with nobody in them.
export async function DELETE(request: Request) {
  const { user } = await currentUser();
  if (!user) return unauthorized();

  const params = new URL(request.url).searchParams;
  const tenantId = params.get("tenant_id");
  const roleId = params.get("role_id");
  if (!tenantId || !roleId) {
    return NextResponse.json({ error: "tenant_id y role_id son requeridos" }, { status: 400 });
  }

  const result = await deleteRole(createAdminClient(), { userId: user.id, tenantId, roleId });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
