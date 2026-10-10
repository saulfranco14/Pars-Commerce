import { NextResponse } from "next/server";

import { listBillingPlans } from "@/features/billing/billingService";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 300;

export async function GET() {
  try {
    const plans = await listBillingPlans(createAdminClient());
    return NextResponse.json(plans, { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600" } });
  } catch (error) {
    console.error("Public billing plans error", error);
    return NextResponse.json({ error: "No pudimos cargar los planes" }, { status: 503 });
  }
}
