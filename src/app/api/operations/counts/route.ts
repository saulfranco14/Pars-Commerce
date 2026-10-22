import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStationCounts } from "@/features/operaciones/services/operationsOverviewService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

// GET /api/operations/counts?tenant_id= — pending work per station, for the station tabs.
export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });

  const result = await getStationCounts(createAdminClient(), { userId: user.id, tenantId });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
