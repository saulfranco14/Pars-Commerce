import { NextResponse } from "next/server";

import { requireGrowthMember } from "@/app/api/growth/_lib";
import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { renderAdPng } from "@/features/growth/services/adImageService";
import { canActOn } from "@/features/growth/services/leadService";
import { adsForLead, loadAdLead } from "@/features/growth/services/prospectAdsService";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

export const runtime = "nodejs";

/** The prospect's gift ad as the operator sends it: with the «Muestra gratis» band. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string; kind: string }> }) {
  const { id, kind } = await params;
  if (!AD_KINDS.includes(kind as AdKind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const gate = await requireGrowthMember();
  if ("error" in gate) return gate.error;
  const lead = await loadAdLead(gate.db, id);
  if (!lead || lead.workspace_id !== gate.actor.workspaceId || !(await canActOn(gate.db, gate.actor, id))) {
    return NextResponse.json({ error: "El prospecto ya no existe." }, { status: 404 });
  }
  const ad = (await adsForLead(gate.db, lead)).ads.find((item) => item.kind === kind);
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return renderAdPng(ad, { mark: true, fileName: `anuncio-${kind}.png` });
}
