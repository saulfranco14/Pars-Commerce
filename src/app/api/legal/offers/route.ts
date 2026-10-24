import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, getOwnerMembership, getPublishedTlacoDocuments } from "@/features/legal/legalActivation";

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, tenantId, user.id))) return NextResponse.json({ error: "Sólo el propietario puede revisar el acuerdo." }, { status: 403 });
  try {
    const documents = await getPublishedTlacoDocuments(admin);
    return NextResponse.json({ documents: documents.map((document: any) => ({ id: document.id, document_type: document.document_type, title: document.title, version: document.version, content: document.content, content_hash: document.content_hash, effective_at: document.effective_at })) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "No pudimos cargar los documentos." }, { status: 500 });
  }
}
