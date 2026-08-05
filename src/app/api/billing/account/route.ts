/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getBillingAccount } from "@/features/billing/billingService";

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId)
    return NextResponse.json(
      { error: "tenant_id es requerido" },
      { status: 400 },
    );
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient() as any;
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    return NextResponse.json(await getBillingAccount(admin, tenantId));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos cargar tu membresía",
      },
      { status: 500 },
    );
  }
}
