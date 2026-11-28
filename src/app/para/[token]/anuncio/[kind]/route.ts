import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { AD_KINDS } from "@/features/growth/constants/prospectAds";
import { renderAdPng } from "@/features/growth/services/adImageService";
import { growthDb } from "@/features/growth/services/growthDb";
import { leadAdsByToken } from "@/features/growth/services/prospectAdsService";

import type { AdKind } from "@/features/growth/interfaces/prospectAds";

export const runtime = "nodejs";

/** One gift ad as a PNG. Public by token, always with the «Muestra gratis» band. */
export async function GET(request: Request, { params }: { params: Promise<{ token: string; kind: string }> }) {
  const { token, kind } = await params;
  if (!AD_KINDS.includes(kind as AdKind)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data = await leadAdsByToken(growthDb(createAdminClient()), token);
  const ad = data?.ads.find((item) => item.kind === kind);
  if (!ad) return NextResponse.json({ error: "Este enlace ya no está disponible." }, { status: 404 });
  const download = new URL(request.url).searchParams.has("descargar");
  return renderAdPng(ad, { mark: true, fileName: `anuncio-${kind}.png`, download });
}
