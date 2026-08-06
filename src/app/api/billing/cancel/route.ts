/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { cancelBilling } from "@/features/billing/billingService";

export async function POST(request: Request) {
  const body = (await request.json()) as { tenant_id?: string };
  if (!body.tenant_id)
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
  const membership = await requirePermission(
    user.id,
    body.tenant_id,
    "settings.write",
  );
  if (!membership || membership.roleName !== "owner")
    return NextResponse.json(
      { error: "Solo el propietario puede cancelar" },
      { status: 403 },
    );
  try {
    return NextResponse.json(
      await cancelBilling({
        admin: createAdminClient() as any,
        tenantId: body.tenant_id,
        actorId: user.id,
      }),
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos cancelar la membresía",
      },
      { status: 500 },
    );
  }
}
