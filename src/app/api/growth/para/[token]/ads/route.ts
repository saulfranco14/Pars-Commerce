import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { readJson } from "@/lib/readJson";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { growthDb } from "@/features/growth/services/growthDb";
import { saveAdEdits } from "@/features/growth/services/prospectAdsService";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

/** Public by token: what the owner typed in one of their ads. */
export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await readJson<{ kind?: string; edit?: unknown }>(request);
  if (!body || !AD_KINDS.includes(body.kind as AdKind)) return NextResponse.json({ error: "Anuncio no válido" }, { status: 400 });
  const result = await saveAdEdits(growthDb(createAdminClient()), token, body.kind as AdKind, body.edit);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ saved: true });
}
