import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  splitOrder,
  type SplitMode,
} from "@/features/qr/services/splitOrderService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

interface RouteContext {
  params: Promise<{ orderId: string }>;
}

interface SplitRequest {
  mode: SplitMode;
  people_count?: number;
  groups?: Array<{ label: string; item_ids: string[] }>;
}

function isMode(value: unknown): value is SplitMode {
  return value === "by_device" || value === "equal" || value === "items";
}

export async function POST(request: Request, context: RouteContext) {
  const { orderId } = await context.params;

  let body: SplitRequest;
  try {
    body = (await request.json()) as SplitRequest;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!isMode(body.mode)) {
    return NextResponse.json(
      { error: "Modo de división inválido" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const result = await splitOrder(admin, {
    orderId,
    mode: body.mode,
    peopleCount: body.people_count,
    groups: body.groups,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({ success: true, groups: result.data.groups });
}
