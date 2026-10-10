import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json() as { tenant_id?: string; acceptance_source?: "dashboard" | "whatsapp" | "call"; note?: string };
  if (!body.tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("approve_initial_catalog" as never, {
    p_tenant_id: body.tenant_id,
    p_actor_id: user.id,
    p_acceptance_source: body.acceptance_source ?? "dashboard",
    p_note: body.note?.trim() || null,
  } as never) as { data: unknown; error: { message: string } | null };
  if (error) return NextResponse.json({ error: error.message }, { status: error.message === "Forbidden" ? 403 : 400 });
  return NextResponse.json(Array.isArray(data) ? data[0] : data);
}
