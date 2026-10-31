import { NextResponse } from "next/server";

import { readJson } from "@/lib/readJson";
import { createAdminClient } from "@/lib/supabase/admin";

import { trackStorefrontView } from "@/features/sitio/services/storefrontViewService";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Beacon from the public store; always answers 204 so it never shows an error to a shopper. */
export async function POST(request: Request) {
  const body = await readJson<{ tenantId?: string }>(request);
  if (typeof body?.tenantId === "string" && UUID.test(body.tenantId)) {
    try {
      await trackStorefrontView(createAdminClient(), {
        tenantId: body.tenantId,
        ip: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "",
        userAgent: request.headers.get("user-agent") ?? "",
      });
    } catch (error) {
      console.error("[storefront] view not counted:", error);
    }
  }
  return new NextResponse(null, { status: 204 });
}
