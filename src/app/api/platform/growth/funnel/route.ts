import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { getFunnel } from "@/features/growth/services/funnelService";
import { growthDb } from "@/features/growth/services/growthDb";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const days = Number(new URL(request.url).searchParams.get("days")) || 7;
  const result = await getFunnel(growthDb(createAdminClient()), days);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
