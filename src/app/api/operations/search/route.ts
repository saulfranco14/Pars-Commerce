import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchOperationsOrders } from "@/features/operaciones/services/operationsOverviewService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

// GET /api/operations/search?tenant_id=&q= — find an order by number, customer or table, and where it is.
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
  if (!tenantId) return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 });

  const result = await searchOperationsOrders(createAdminClient(), {
    userId: user.id,
    tenantId,
    query: searchParams.get("q") ?? "",
  });
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
