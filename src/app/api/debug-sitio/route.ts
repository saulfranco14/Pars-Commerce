import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") ?? "autolavado-villada";

  try {
    const supabase = createAdminClient();
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("id, name, slug, public_store_enabled")
      .eq("slug", slug)
      .single();

    return NextResponse.json({
      slug,
      found: !!tenant,
      error: error?.message ?? null,
      tenant: tenant ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
