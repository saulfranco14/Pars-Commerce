import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, createAcceptancePdf, getOwnerMembership, getPublishedTlacoDocuments, LEGAL_REPRESENTATION_DECLARATION } from "@/features/legal/legalActivation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { tenant_id?: string; idempotency_key?: string; declaration?: string } | null;
  if (!body?.tenant_id || !body.idempotency_key || body.declaration?.trim() !== LEGAL_REPRESENTATION_DECLARATION) return NextResponse.json({ error: "Confirma la declaración de representación para continuar." }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, body.tenant_id, user.id))) return NextResponse.json({ error: "Sólo el propietario puede aceptar por el negocio." }, { status: 403 });
  const [{ data: profile }, { data: tenant }] = await Promise.all([
    admin.from("tenant_legal_profiles").select("*").eq("tenant_id", body.tenant_id).maybeSingle(),
    admin.from("tenants").select("id, name").eq("id", body.tenant_id).maybeSingle(),
  ]);
  if (!profile || !tenant) return NextResponse.json({ error: "Completa tus datos legales antes de aceptar." }, { status: 400 });
  try {
    const documents = await getPublishedTlacoDocuments(admin);
    const snapshot = documents.map((document: any) => ({ id: document.id, type: document.document_type, title: document.title, version: document.version, content_hash: document.content_hash }));
    const { data: acceptance, error } = await admin.from("tenant_legal_acceptances").upsert({
      tenant_id: body.tenant_id,
      accepted_by: user.id,
      legal_profile_snapshot: profile,
      document_snapshot: snapshot,
      declaration: LEGAL_REPRESENTATION_DECLARATION,
      idempotency_key: body.idempotency_key.slice(0, 120),
    }, { onConflict: "tenant_id,idempotency_key" }).select("*").single();
    if (error || !acceptance) return NextResponse.json({ error: error?.message ?? "No pudimos registrar la aceptación." }, { status: 500 });
    if (!acceptance.evidence_path) {
      const pdf = await createAcceptancePdf({ acceptanceId: acceptance.id, tenantName: tenant.name, profile, documents, acceptedAt: acceptance.accepted_at });
      const path = `${body.tenant_id}/${acceptance.id}.pdf`;
      const { error: uploadError } = await admin.storage.from("legal-evidence").upload(path, pdf, { contentType: "application/pdf", upsert: false });
      if (!uploadError) await admin.from("tenant_legal_acceptances").update({ evidence_path: path }).eq("id", acceptance.id);
    }
    return NextResponse.json({ acceptance_id: acceptance.id, accepted_at: acceptance.accepted_at });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos registrar la aceptación." }, { status: 500 });
  }
}
