import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createAdminClient();

  const { data: templates, error } = await supabase
    .from("site_templates")
    .select("id, slug, name, description, preview_image_url, layout_variant, default_theme_color, config, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(templates ?? []);
}
