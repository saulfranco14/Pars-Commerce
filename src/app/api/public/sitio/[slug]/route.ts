import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  if (!slug) {
    return NextResponse.json({ error: "slug is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, slug, description, theme_color, whatsapp_phone, social_links")
    .eq("slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    return NextResponse.json({ error: "Site not found" }, { status: 404 });
  }

  const { data: pages } = await supabase
    .from("tenant_site_pages")
    .select("id, slug, title, position, content")
    .eq("tenant_id", tenant.id)
    .eq("is_enabled", true)
    .order("position", { ascending: true });

  return NextResponse.json({
    tenant: {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      description: tenant.description,
      theme_color: tenant.theme_color,
      whatsapp_phone: tenant.whatsapp_phone,
      social_links: tenant.social_links ?? {},
    },
    pages: pages ?? [],
  });
}
