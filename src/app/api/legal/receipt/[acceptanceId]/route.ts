import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin } from "@/features/legal/legalActivation";

export async function GET(_request: Request, { params }: { params: Promise<{ acceptanceId: string }> }) {
  const [{ acceptanceId }, session] = await Promise.all([params, createClient()]);
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  const { data: acceptance } = await admin.from("tenant_legal_acceptances").select("tenant_id, evidence_path").eq("id", acceptanceId).maybeSingle();
  if (!acceptance?.evidence_path) return NextResponse.json({ error: "Comprobante no disponible." }, { status: 404 });
  const { data: membership } = await admin.from("tenant_memberships").select("id").eq("tenant_id", acceptance.tenant_id).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const signed = await admin.storage.from("legal-evidence").createSignedUrl(acceptance.evidence_path, 15 * 60);
  if (signed.error || !signed.data?.signedUrl) return NextResponse.json({ error: signed.error?.message ?? "No pudimos abrir el comprobante." }, { status: 500 });
  return NextResponse.redirect(signed.data.signedUrl);
}
