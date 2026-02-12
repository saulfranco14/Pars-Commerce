import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { sanitizeHtml } from "@/lib/sanitizeHtml";

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

  const { data: pages, error } = await supabase
    .from("tenant_site_pages")
    .select("id, slug, title, position, content, is_enabled")
    .eq("tenant_id", tenantId)
    .order("position", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(pages ?? []);
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

  let body: { tenant_id?: string; page_id?: string; slug?: string; content?: Record<string, unknown> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { tenant_id, page_id, slug, content } = body;

  const pageKey = page_id || slug;
  if (!tenant_id || !pageKey || content === undefined) {
    return NextResponse.json(
      { error: "tenant_id, page_id or slug, and content are required" },
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

  const contentRecord = content as Record<string, unknown>;
  const sanitizedContent: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(contentRecord)) {
    if (typeof value === "string" && ["body", "welcome_text", "welcome_message"].includes(key)) {
      sanitizedContent[key] = sanitizeHtml(value);
    } else if (value !== undefined && value !== null) {
      sanitizedContent[key] = value;
    }
  }

  const finalContent = { ...contentRecord, ...sanitizedContent };

  let query = admin
    .from("tenant_site_pages")
    .update({
      content: finalContent,
      updated_at: new Date().toISOString(),
    })
    .eq("tenant_id", tenant_id);

  if (page_id) {
    query = query.eq("id", page_id);
  } else {
    query = query.eq("slug", slug);
  }

  const { data: updated, error } = await query.select("id, slug, content").single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(updated);
}
