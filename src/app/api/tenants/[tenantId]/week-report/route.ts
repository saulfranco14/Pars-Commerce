import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { tenantWeekReport } from "@/features/ventas/services/weekReportService";

type Context = { params: Promise<{ tenantId: string }> };

/** «Su semana»: last 7 days against the 7 before, low days and the next date that moves sales. */
export async function GET(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission(user.id, tenantId, "money.read"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await tenantWeekReport(createAdminClient(), tenantId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
