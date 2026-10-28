import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { growthDb } from "@/features/growth/services/growthDb";
import { requestParaVisit } from "@/features/growth/services/paraService";

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await readJson<unknown>(request);
  const result = await requestParaVisit(growthDb(createAdminClient()), token, body);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
