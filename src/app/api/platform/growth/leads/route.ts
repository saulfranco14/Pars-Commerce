import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { listLeads } from "@/features/growth/services/leadService";
import { parseLeadFilters } from "@/features/growth/helpers/leadFiltersQuery";

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const result = await listLeads(growthDb(createAdminClient()), parseLeadFilters(new URL(request.url).searchParams));
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
