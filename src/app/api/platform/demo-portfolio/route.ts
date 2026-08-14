/* eslint-disable @typescript-eslint/no-explicit-any -- commercial tables ship in the accompanying migration. */
import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { requirePlatformAdmin } from "../_lib";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureCatalogTemplates } from "@/features/catalog/catalogBootstrap";
import { DEMO_CATALOGS } from "@/features/catalog/catalogDefinitions";
import { DEMO_PORTFOLIO } from "@/features/catalog/demoPortfolio";

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const body = await request.json().catch(() => null) as { target_user_id?: string } | null;
  const targetUserId = body?.target_user_id?.trim() || gate.user.id;

  const admin = createAdminClient() as unknown as SupabaseClient<any>;
  const { data: targetAdmin } = await admin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", targetUserId)
    .maybeSingle();
  if (!targetAdmin) {
    return NextResponse.json({ error: "El usuario destino debe ser super admin." }, { status: 403 });
  }

  try {
    await ensureCatalogTemplates(admin);
    const results = [];
    for (const demo of DEMO_PORTFOLIO) {
      const catalog = DEMO_CATALOGS.find((entry) => entry.key === demo.catalogKey);
      if (!catalog) throw new Error(`No existe el catálogo ${demo.catalogKey}`);
      const { data, error } = await admin.rpc("create_tenant_with_catalog", {
        p_owner_user_id: targetUserId,
        p_name: demo.name,
        p_slug: demo.slug,
        p_business_type: catalog.businessType,
        p_catalog_template_key: catalog.key,
        p_site_template_id: null,
        p_is_demo: true,
        p_demo_key: demo.demoKey,
      });
      if (error) throw new Error(error.message);
      const created = Array.isArray(data) ? data[0] : data;
      if (!created?.id) throw new Error(`No se pudo crear ${demo.name}`);
      const { error: updateError } = await admin
        .from("tenants")
        .update({
          description: demo.description,
          theme_color: demo.themeColor,
          public_store_enabled: true,
          accepting_orders: false,
          whatsapp_orders_enabled: false,
        })
        .eq("id", created.id);
      if (updateError) throw new Error(updateError.message);
      results.push({ ...created, demo_key: demo.demoKey });
    }
    return NextResponse.json({ demos: results, count: results.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos preparar el portafolio demo." }, { status: 500 });
  }
}
