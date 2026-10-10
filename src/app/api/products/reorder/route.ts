import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as {
    tenant_id?: string;
    item_ids?: string[];
  };
  const itemIds = Array.isArray(body.item_ids)
    ? [...new Set(body.item_ids.filter(Boolean))]
    : [];

  if (!body.tenant_id || itemIds.length === 0) {
    return NextResponse.json(
      { error: "tenant_id and item_ids are required" },
      { status: 400 },
    );
  }

  const { error } = await supabase.rpc("reorder_catalog_items", {
    p_tenant_id: body.tenant_id,
    p_item_ids: itemIds,
  });

  if (error) {
    const status = error.message === "Forbidden" ? 403 : 400;
    return NextResponse.json({ error: error.message }, { status });
  }

  return NextResponse.json({ ok: true });
}
