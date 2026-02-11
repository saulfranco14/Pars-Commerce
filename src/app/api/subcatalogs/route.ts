import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
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

  const { data: subcatalogs, error } = await supabase
    .from("product_subcatalogs")
    .select("id, name, slug, tenant_id, created_at")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subcatalogs ?? []);
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
  const { tenant_id, name } = body as { tenant_id: string; name: string };

  if (!tenant_id || !name || typeof name !== "string") {
    return NextResponse.json(
      { error: "tenant_id and name are required" },
      { status: 400 }
    );
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "name cannot be empty" },
      { status: 400 }
    );
  }

  const slug = deriveSlug(trimmed);
  if (!slug) {
    return NextResponse.json(
      { error: "name must contain at least one alphanumeric character" },
      { status: 400 }
    );
  }

  const { data: subcatalog, error } = await supabase
    .from("product_subcatalogs")
    .insert({ tenant_id, name: trimmed, slug })
    .select("id, name, slug, tenant_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A subcatalog with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subcatalog);
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
  const { subcatalog_id, name } = body as { subcatalog_id: string; name: string };

  if (!subcatalog_id || !name || typeof name !== "string") {
    return NextResponse.json(
      { error: "subcatalog_id and name are required" },
      { status: 400 }
    );
  }

  const trimmed = name.trim();
  if (!trimmed) {
    return NextResponse.json(
      { error: "name cannot be empty" },
      { status: 400 }
    );
  }

  const slug = deriveSlug(trimmed);
  if (!slug) {
    return NextResponse.json(
      { error: "name must contain at least one alphanumeric character" },
      { status: 400 }
    );
  }

  const { data: subcatalog, error } = await supabase
    .from("product_subcatalogs")
    .update({ name: trimmed, slug })
    .eq("id", subcatalog_id)
    .select("id, name, slug, tenant_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A subcatalog with this name already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subcatalog);
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
  const subcatalogId = searchParams.get("subcatalog_id");

  if (!subcatalogId) {
    return NextResponse.json(
      { error: "subcatalog_id is required" },
      { status: 400 }
    );
  }

  const { error: delError } = await supabase
    .from("product_subcatalogs")
    .delete()
    .eq("id", subcatalogId);

  if (delError) {
    return NextResponse.json({ error: delError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
