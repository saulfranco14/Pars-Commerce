import { createClient } from "@/lib/supabase/server";
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

  const [productsRes, servicesRes] = await Promise.all([
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("type", "product"),
    supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenantId)
      .eq("type", "service"),
  ]);

  const productsCount = productsRes.count ?? 0;
  const servicesCount = servicesRes.count ?? 0;

  return NextResponse.json({
    products_count: productsCount,
    services_count: servicesCount,
  });
}
