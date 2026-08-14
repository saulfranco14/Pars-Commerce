/* eslint-disable @typescript-eslint/no-explicit-any -- catalog migration is deployed before this route. */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCatalogTemplates } from "@/features/catalog/catalogBootstrap";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessType = new URL(request.url).searchParams.get("business_type")?.trim();
  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const { count, error: countError } = await admin
    .from("catalog_templates")
    .select("id", { count: "exact", head: true });
  if (countError) return NextResponse.json({ error: countError.message }, { status: 500 });
  // Deployment-safe bootstrap: the first onboarding after the migration makes
  // the managed starter catalog available. Later reads are read-only.
  if (!count) await ensureCatalogTemplates(admin);

  let query = admin
    .from("catalog_templates")
    .select("id, key, version, business_type, name, description, catalog_template_items(type)")
    .eq("is_active", true)
    .order("name");
  if (businessType) query = query.eq("business_type", businessType);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map((template: any) => {
    const items = template.catalog_template_items ?? [];
    return {
      key: template.key,
      version: template.version,
      business_type: template.business_type,
      name: template.name,
      description: template.description,
      products_count: items.filter((item: { type: string }) => item.type === "product").length,
      services_count: items.filter((item: { type: string }) => item.type === "service").length,
    };
  }));
}
