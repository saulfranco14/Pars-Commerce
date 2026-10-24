import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, getOwnerMembership } from "@/features/legal/legalActivation";
import { buildTenantDataExport } from "@/features/legal/dataExport";

type Context = { params: Promise<{ tenantId: string }> };

export async function POST(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, tenantId, user.id))) return NextResponse.json({ error: "Sólo el propietario puede exportar todo el negocio." }, { status: 403 });
  try {
    const result = await buildTenantDataExport(admin, tenantId, user.id);
    const signed = await (admin.storage.from("legal-exports") as any).createSignedUrl(result.path, 15 * 60);
    if (signed.error || !signed.data?.signedUrl) throw new Error(signed.error?.message ?? "No pudimos preparar tu descarga.");
    return NextResponse.json({ export_id: result.exportId, status: "ready", download_url: signed.data.signedUrl, expires_at: result.expiresAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos exportar tus datos." }, { status: 500 });
  }
}
