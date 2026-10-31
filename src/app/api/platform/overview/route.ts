import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/app/api/platform/_lib";
import { createAdminClient } from "@/lib/supabase/admin";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { getPlatformOverview } from "@/features/platform/services/platformOverviewService";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const days = Number(new URL(request.url).searchParams.get("days")) || 30;
  const result = await getPlatformOverview(createAdminClient(), days);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
