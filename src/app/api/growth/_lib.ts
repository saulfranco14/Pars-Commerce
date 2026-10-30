import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

import { growthDb } from "@/features/growth/services/growthDb";
import { resolveActor } from "@/features/growth/services/memberService";

/**
 * Gate for every prospecting route: signed in → member of the workspace → coordinator when `manage`.
 * The SQL functions check ownership again, so a route never decides alone who may touch a lead.
 */
export async function requireGrowthMember(options: { manage?: boolean } = {}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;
  const db = growthDb(createAdminClient());
  const actor = await resolveActor(db, user.id);
  if (!actor) return { error: NextResponse.json({ error: "No eres parte del equipo de prospección." }, { status: 403 }) } as const;
  if (options.manage && actor.role !== "coordinador") {
    return { error: NextResponse.json({ error: "Solo el coordinador puede hacer esto." }, { status: 403 }) } as const;
  }
  return { actor, db } as const;
}
