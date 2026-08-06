/* eslint-disable @typescript-eslint/no-explicit-any -- billing migration is deployed before generated DB types. */
import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { applyBillingLifecycle } from "@/features/billing/billingService";

/** Daily signed cron: ends cancellations and the seven-day failed-payment grace. */
async function run(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret)
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 503 },
    );
  const valid = request.headers.get("x-cron-secret") === secret || request.headers.get("authorization") === `Bearer ${secret}`;
  if (!valid)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const result = await applyBillingLifecycle(createAdminClient() as any);
    return NextResponse.json({ ran_at: new Date().toISOString(), ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos aplicar el ciclo de membresías",
      },
      { status: 500 },
    );
  }
}

export const GET = run;
export const POST = run;
