import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { requirePermission } from "@/lib/auth/requirePermission";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { parseSetupCheckoutInput } from "@/features/onboarding/helpers/setupCheckoutValidation";
import { getSetupCheckoutSnapshot, saveSetupCheckout } from "@/features/onboarding/services/setupCheckoutService";

type Context = { params: Promise<{ tenantId: string }> };

async function authorize(tenantId: string) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = await requirePermission(user.id, tenantId, "settings.write");
  if (!role) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return null;
}

export async function GET(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const denied = await authorize(tenantId);
  if (denied) return denied;
  const result = await getSetupCheckoutSnapshot(tenantId);
  return result.ok ? NextResponse.json(result.data) : serviceErrorToResponse(result.error);
}

export async function POST(request: Request, { params }: Context) {
  const [{ tenantId }, body] = await Promise.all([params, request.json().catch(() => null)]);
  const denied = await authorize(tenantId);
  if (denied) return denied;
  const input = parseSetupCheckoutInput(body);
  if (!input) return NextResponse.json({ error: "Revisa los datos de entrega y cobro." }, { status: 400 });
  const result = await saveSetupCheckout(tenantId, input);
  return result.ok ? NextResponse.json({ success: true }) : serviceErrorToResponse(result.error);
}
