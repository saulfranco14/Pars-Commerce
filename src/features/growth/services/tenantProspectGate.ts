import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";

import { growthDb } from "@/features/growth/services/growthDb";
import { tenantProspectLead } from "@/features/growth/services/prospectWelcomeService";

import type { GrowthDb } from "@/features/growth/services/growthDb";
import type { AdLead } from "@/features/growth/services/prospectAdsService";

/** Signed in → can read the business summary → the prospect it came from; 404 for businesses that did not. */
export async function requireTenantProspect(tenantId: string): Promise<{ db: GrowthDb; lead: AdLead } | { error: NextResponse }> {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (!(await requirePermission(user.id, tenantId, "reports.read"))) return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  const db = growthDb(createAdminClient());
  const lead = await tenantProspectLead(db, tenantId, user.user_metadata);
  if (!lead) return { error: NextResponse.json({ error: "Este negocio no viene de unos anuncios de regalo." }, { status: 404 }) };
  return { db, lead };
}
