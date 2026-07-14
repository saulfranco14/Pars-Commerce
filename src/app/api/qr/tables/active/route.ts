import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

export interface ActiveTableSummary {
  qr_code_id: string;
  label: string;
  order_id: string;
  total: number;
  fulfillment_status: string;
}

/**
 * Lean summary of table QR codes that currently have a customer connected
 * (`current_order_id` set) — for the dashboard home's "mesas activas" widget.
 * Only what that widget renders: label, running total, preparation state.
 * Full detail (items, devices, payments) lives in the mesa detail page.
 */
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
    return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  }

  const canRead = await requirePermission(user.id, tenantId, "qr.read");
  if (!canRead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();

  const { data: tables } = await admin
    .from("qr_codes")
    .select("id, label, current_order_id")
    .eq("tenant_id", tenantId)
    .eq("kind", "table")
    .is("archived_at", null)
    .not("current_order_id", "is", null);

  const orderIds = (tables ?? [])
    .map((t) => t.current_order_id as string | null)
    .filter((id): id is string => !!id);

  if (orderIds.length === 0) {
    return NextResponse.json([] satisfies ActiveTableSummary[]);
  }

  const { data: orders } = await admin
    .from("orders")
    .select("id, total, fulfillment_status, status")
    .in("id", orderIds);

  const orderById = new Map((orders ?? []).map((o) => [o.id as string, o]));

  const summaries: ActiveTableSummary[] = (tables ?? [])
    .map((table) => {
      const order = table.current_order_id
        ? orderById.get(table.current_order_id)
        : undefined;
      // Order gone or already settled (paid/cancelled) — the QR's
      // current_order_id just hasn't been cleared yet; skip it here.
      if (!order || order.status === "paid" || order.status === "cancelled") {
        return null;
      }
      return {
        qr_code_id: table.id,
        label: table.label,
        order_id: order.id,
        total: Number(order.total ?? 0),
        fulfillment_status: order.fulfillment_status ?? "received",
      };
    })
    .filter((s): s is ActiveTableSummary => s !== null);

  return NextResponse.json(summaries);
}
