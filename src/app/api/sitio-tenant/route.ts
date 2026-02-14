import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json(
      { error: "slug is required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: tenant, error } = await supabase
    .from("tenants")
    .select("id")
    .eq("slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (error || !tenant) {
    return NextResponse.json(
      { error: "Tenant not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ tenant_id: tenant.id });
}
