import { NextResponse } from "next/server";

import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { renderAdPng } from "@/features/growth/services/adImageService";
import { adsForLead } from "@/features/growth/services/prospectAdsService";
import { requireTenantProspect } from "@/features/growth/services/tenantProspectGate";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

export const runtime = "nodejs";

type Context = { params: Promise<{ tenantId: string; kind: string }> };

/** The business's own ad, now without the «Muestra gratis» band. */
export async function GET(request: Request, { params }: Context) {
  const { tenantId, kind } = await params;
  if (!AD_KINDS.includes(kind as AdKind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const gate = await requireTenantProspect(tenantId);
  if ("error" in gate) return gate.error;
  const ad = (await adsForLead(gate.db, gate.lead)).ads.find((item) => item.kind === kind);
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return renderAdPng(ad, { mark: false, fileName: `anuncio-${kind}.png`, download: new URL(request.url).searchParams.has("descargar") });
}
