import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: memberships, error } = await supabase
    .from("tenant_memberships")
    .select(
      `
      id,
      tenant_id,
      role_id,
      accepted_at,
      tenant:tenants(id, name, slug, business_type, logo_url, theme_color, description, public_store_enabled),
      role:tenant_roles(id, name, permissions)
    `
    )
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(memberships ?? []);
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
  const { name, slug, business_type } = body as {
    name: string;
    slug: string;
    business_type?: string;
  };

  if (!name || !slug) {
    return NextResponse.json(
      { error: "name and slug are required" },
      { status: 400 }
    );
  }

  const normalizedSlug = slug
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

  const admin = createAdminClient();

  const { data: tenant, error: tenantError } = await admin
    .from("tenants")
    .insert({
      name,
      slug: normalizedSlug,
      business_type: business_type ?? null,
    })
    .select("id, name, slug")
    .single();

  if (tenantError) {
    if (tenantError.code === "23505") {
      return NextResponse.json(
        { error: "Slug already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: tenantError.message }, { status: 500 });
  }

  const { data: ownerRole } = await admin
    .from("tenant_roles")
    .select("id")
    .eq("tenant_id", tenant.id)
    .eq("name", "owner")
    .single();

  if (ownerRole) {
    await admin.from("tenant_memberships").insert({
      user_id: user.id,
      tenant_id: tenant.id,
      role_id: ownerRole.id,
      accepted_at: new Date().toISOString(),
    });
  }

  return NextResponse.json(tenant);
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
  const { tenant_id, name, description, theme_color, public_store_enabled } =
    body as {
      tenant_id: string;
      name?: string;
      description?: string;
      theme_color?: string;
      public_store_enabled?: boolean;
    };

  if (!tenant_id) {
    return NextResponse.json(
      { error: "tenant_id is required" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("role:tenant_roles(name, permissions)")
    .eq("user_id", user.id)
    .eq("tenant_id", tenant_id)
    .single();

  const rawRole = membership?.role as
    | { name: string; permissions: string[] }
    | { name: string; permissions: string[] }[]
    | null
    | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  const canWrite =
    role &&
    (role.name === "owner" ||
      (Array.isArray(role.permissions) &&
        role.permissions.includes("settings.write")));

  if (!canWrite) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (name !== undefined) updates.name = name.trim();
  if (description !== undefined)
    updates.description = description?.trim() ?? null;
  if (theme_color !== undefined)
    updates.theme_color = theme_color?.trim() || null;
  if (public_store_enabled !== undefined)
    updates.public_store_enabled = public_store_enabled;

  const { data: tenant, error } = await admin
    .from("tenants")
    .update(updates)
    .eq("id", tenant_id)
    .select("id, name, slug, description, theme_color, public_store_enabled")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(tenant);
}
