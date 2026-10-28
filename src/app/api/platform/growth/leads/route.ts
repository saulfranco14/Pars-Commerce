import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/app/api/platform/_lib";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { listLeads } from "@/features/growth/services/leadService";

import type { LeadContactFilter, LeadFilters, LeadStageFilter, NextChannel } from "@/features/growth/interfaces/lead";

const CONTACT_FILTERS: LeadContactFilter[] = ["whatsapp", "correo", "ambos", "sin"];

export async function GET(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const params = new URL(request.url).searchParams;
  const filters: LeadFilters = {
    municipio: params.get("municipio") || undefined,
    giro: params.get("giro") || undefined,
    stage: (params.get("stage") as LeadStageFilter | null) || undefined,
    channel: (params.get("channel") as NextChannel | null) || undefined,
    contact: CONTACT_FILTERS.find((value) => value === params.get("contact")),
    q: params.get("q") || undefined,
    page: Number(params.get("page")) || 1,
  };
  const result = await listLeads(growthDb(createAdminClient()), filters);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
