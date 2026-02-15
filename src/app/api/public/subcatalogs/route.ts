import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

async function getTenantIdBySlug(supabase: ReturnType<typeof createAdminClient>, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("public_store_enabled", true)
    .single();
  return data?.id ?? null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant_slug");
  const tenantIdParam = searchParams.get("tenant_id");

  if (!tenantSlug && !tenantIdParam) {
    return NextResponse.json(
      { error: "tenant_slug or tenant_id is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();

  let tenantId: string | null = tenantIdParam ?? null;
  if (!tenantId && tenantSlug) {
    tenantId = await getTenantIdBySlug(supabase, tenantSlug);
  }
  if (!tenantId) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const { data: subcatalogs, error } = await supabase
    .from("product_subcatalogs")
    .select("id, name, slug")
    .eq("tenant_id", tenantId)
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(subcatalogs ?? []);
}
