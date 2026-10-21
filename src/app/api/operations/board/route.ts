import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStationBoard } from "@/features/operaciones/services/operationsBoardService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { ensureDuePeriods } from "@/features/suscripciones/services/planSubscriptionService";

// GET /api/operations/board?tenant_id=&station=&view=active|done — one work station's columns.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tenantId = searchParams.get("tenant_id");
  const station = searchParams.get("station");
  if (!tenantId || !station) {
    return NextResponse.json({ error: "tenant_id y station son requeridos" }, { status: 400 });
  }

  const admin = createAdminClient();
  const params = { userId: user.id, tenantId, station, view: searchParams.get("view") ?? undefined };
  let result = await getStationBoard(admin, params);
  if (!result.ok) return serviceErrorToResponse(result.error);

  // No cron yet: opening the board is one of the moments renewals get issued.
  const issued = await ensureDuePeriods(admin, { tenantId });
  if (issued.ok && issued.data > 0) {
    result = await getStationBoard(admin, params);
    if (!result.ok) return serviceErrorToResponse(result.error);
  }
  return NextResponse.json(result.data);
}
