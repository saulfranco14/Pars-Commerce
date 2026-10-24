import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { asLegalAdmin, cleanLegalProfile, getOwnerMembership } from "@/features/legal/legalActivation";

type Context = { params: Promise<{ tenantId: string }> };

export async function GET(_request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, tenantId, user.id))) return NextResponse.json({ error: "Sólo el propietario puede consultar estos datos." }, { status: 403 });
  const { data, error } = await admin.from("tenant_legal_profiles").select("*").eq("tenant_id", tenantId).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data ?? null });
}

export async function PATCH(request: Request, { params }: Context) {
  const { tenantId } = await params;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const profile = cleanLegalProfile(await request.json().catch(() => null));
  if (!profile) return NextResponse.json({ error: "Completa los datos legales requeridos." }, { status: 400 });
  const admin = asLegalAdmin(createAdminClient());
  if (!(await getOwnerMembership(admin, tenantId, user.id))) return NextResponse.json({ error: "Sólo el propietario puede guardar estos datos." }, { status: 403 });
  const { data, error } = await admin.from("tenant_legal_profiles").upsert({ tenant_id: tenantId, ...profile, updated_by: user.id, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" }).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
