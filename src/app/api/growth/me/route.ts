import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requestActor } from "@/app/api/growth/_lib";

import { growthDb } from "@/features/growth/services/growthDb";

import type { GrowthMe } from "@/features/growth/interfaces/member";

/** Answers 200 with `actor: null` for non-members, so the sidebar and the login can ask without failing. */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const actor = await requestActor(growthDb(createAdminClient()), user.id);
  return NextResponse.json({ actor } satisfies GrowthMe);
}
