import { NextResponse } from "next/server";

import { requirePlatformAdmin } from "@/app/api/platform/_lib";
import { createPreviewLink } from "@/features/preview/previewLinks";
import { getAppUrl } from "@/lib/env/appUrl";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await request.json() as { tenant_id?: string; expires_in_hours?: number };
  if (!body.tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  const preview = await createPreviewLink(createAdminClient(), { tenantId: body.tenant_id, createdBy: gate.user.id, expiresInHours: Math.min(Math.max(body.expires_in_hours ?? 72, 1), 720) });
  return NextResponse.json({ id: preview.id, expires_at: preview.expiresAt, preview_url: `${getAppUrl()}/vista-previa/${preview.token}` }, { status: 201 });
}

export async function DELETE(request: Request) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const body = await request.json() as { id?: string };
  if (!body.id) return NextResponse.json({ error: "id is required" }, { status: 400 });
  const { error } = await createAdminClient().from("tenant_preview_links" as never).update({ revoked_at: new Date().toISOString() } as never).eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
