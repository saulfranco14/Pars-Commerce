import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, createLetterheadDocumentPdf } from "@/features/legal/legalActivation";

type Context = { params: Promise<{ documentId: string }> };

export async function GET(request: Request, { params }: Context) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  const [{ documentId }, session] = await Promise.all([params, createClient()]);
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!tenantId) return NextResponse.json({ error: "Falta el negocio." }, { status: 400 });
  const admin = asLegalAdmin(createAdminClient());
  const { data: membership } = await admin.from("tenant_memberships").select("id").eq("tenant_id", tenantId).eq("user_id", user.id).eq("status", "active").maybeSingle();
  if (!membership) return NextResponse.json({ error: "No tienes acceso a este documento." }, { status: 403 });
  const { data: document } = await admin.from("legal_document_versions").select("id, title, version, content, content_hash, effective_at").eq("id", documentId).is("tenant_id", null).maybeSingle();
  if (!document) return NextResponse.json({ error: "Documento no encontrado." }, { status: 404 });
  const pdf = await createLetterheadDocumentPdf(document);
  return new Response(pdf, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="tlaco-${document.version}.pdf"`, "Cache-Control": "private, no-store" } });
}
