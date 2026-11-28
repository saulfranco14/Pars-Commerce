import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

import { growthDb, isGrowthEnabled } from "@/features/growth/services/growthDb";
import { notifyOperators } from "@/features/growth/services/operatorService";
import { removeProspectData } from "@/features/growth/services/prospectAdsService";
import { escapeHtml } from "@/features/growth/services/telegramApi";

/** «¿No es suyo? Quitar mis datos»: baja in every channel and the page stops working. */
export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = growthDb(createAdminClient());
  try {
    const removed = await removeProspectData(db, token);
    if (removed && isGrowthEnabled()) {
      await notifyOperators(db, { text: `${escapeHtml(removed.businessName)} pidió quitar sus datos. Quedó de baja en todos los canales.` }, { workspaceId: removed.workspaceId, ownerId: removed.ownerId });
    }
    return NextResponse.json({ removed: true });
  } catch (error) {
    console.error("[growth] remove prospect data failed:", error);
    return NextResponse.json({ error: "No pudimos quitar sus datos. Intente de nuevo." }, { status: 500 });
  }
}
