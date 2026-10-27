import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { safeEqual } from "@/features/growth/helpers/safeEqual";
import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { runTick } from "@/features/growth/services/tickService";

export const maxDuration = 60;

/** Called every 10 minutes by pg_cron (growth_cron_tick). Fails closed without the secret. */
async function run(request: Request) {
  if (!isGrowthEnabled()) return NextResponse.json({ error: "Growth engine disabled" }, { status: 503 });
  const secret = process.env.GROWTH_CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "GROWTH_CRON_SECRET not configured" }, { status: 503 });
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!safeEqual(request.headers.get("x-cron-secret") ?? bearer, secret)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await runTick(growthDb(createAdminClient()));
    return NextResponse.json({ ran_at: new Date().toISOString(), ...result });
  } catch (error) {
    console.error("[growth] tick failed:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "tick failed" }, { status: 500 });
  }
}

export const GET = run;
export const POST = run;
