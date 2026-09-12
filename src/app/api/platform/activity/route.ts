import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const url = new URL(request.url);
  const tenantId = url.searchParams.get("tenant_id");
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 100);
  const admin = createAdminClient();
  let query = admin.from("platform_activity_events" as never).select("id, tenant_id, actor_id, action, entity_type, entity_id, payload, created_at").order("created_at", { ascending: false }).limit(limit);
  if (tenantId) query = query.eq("tenant_id", tenantId);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}
