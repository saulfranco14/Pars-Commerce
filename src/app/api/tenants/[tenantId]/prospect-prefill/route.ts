import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";

import { growthDb } from "@/features/growth/services/growthDb";
import { getProspectPrefill } from "@/features/growth/services/prospectPrefillService";

type Context = { params: Promise<{ tenantId: string }> };

/** Address of a store claimed from a "Para ti" link; `{ pickupPoint: null }` for every other signup. */
export async function GET(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await requirePermission(user.id, tenantId, "settings.write");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const intent = user.user_metadata?.registration_intent as { tenant_id?: string; prospect_token?: string | null } | undefined;
  const prospectToken = intent?.tenant_id === tenantId ? intent.prospect_token ?? null : null;
  return NextResponse.json(await getProspectPrefill(growthDb(createAdminClient()), { tenantId, prospectToken }));
}
