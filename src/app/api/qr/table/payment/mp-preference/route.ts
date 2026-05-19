import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createTableMpPreference } from "@/features/qr/services/tableMpPreferenceService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RequestBody {
  order_id: string;
  group_id?: string | null;
  qr_token: string;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.order_id || !body.qr_token) {
    return NextResponse.json(
      { error: "order_id y qr_token son requeridos" },
      { status: 400 },
    );
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    new URL(request.url).origin;

  const admin = createAdminClient();
  const result = await createTableMpPreference(admin, {
    orderId: body.order_id,
    groupId: body.group_id ?? null,
    qrToken: body.qr_token,
    baseUrl,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    init_point: result.data.initPoint,
    preference_id: result.data.preferenceId,
    amount: result.data.amount,
  });
}
