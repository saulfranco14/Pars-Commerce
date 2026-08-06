import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../_lib";

export async function GET() {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const admin = createAdminClient();
  const [openOrders, stuckTables, recentActivity] = await Promise.all([
    admin.from("orders").select("id", { count: "exact", head: true }).in("status", ["pending_payment", "in_progress"]),
    admin.from("orders").select("id, tenant_id, table_label, created_at").eq("source", "qr_table").in("status", ["draft", "in_progress", "pending_payment"]).lt("created_at", new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()).limit(50),
    admin.from("platform_activity_events" as never).select("id", { count: "exact", head: true }).in("action", ["payment.webhook_failed", "inventory.stock_negative"]).gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
  ]);
  return NextResponse.json({
    open_orders: openOrders.count ?? 0,
    stale_tables: stuckTables.data ?? [],
    errors_last_24h: recentActivity.count ?? 0,
  });
}
