import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";

import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { tenantOutsideContext } from "@/features/ventas/services/weekReportService";

export const maxDuration = 60;

type Context = { params: Promise<{ tenantId: string }> };

/** What Gemini found outside the business this week, with its sources; cached per giro, place and day. */
export async function GET(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await requirePermission(user.id, tenantId, "money.read"))) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const result = await tenantOutsideContext(createAdminClient(), tenantId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
