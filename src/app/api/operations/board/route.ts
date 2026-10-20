import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStationBoard } from "@/features/operaciones/services/operationsBoardService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

// GET /api/operations/board?tenant_id=&station= — the columns of one work station.
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

  const result = await getStationBoard(createAdminClient(), { userId: user.id, tenantId, station });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
