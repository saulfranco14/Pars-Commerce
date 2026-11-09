import { NextResponse } from "next/server";
import {
  reconcileStudio,
  validStudioCronSecret,
} from "@/features/studio/services/studioReconcileService";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
export async function POST(request: Request) {
  if (!validStudioCronSecret(request.headers.get("x-studio-cron-secret")))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    return NextResponse.json(await reconcileStudio(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "reconciliation_pending" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
