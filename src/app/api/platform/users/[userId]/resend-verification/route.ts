import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../../../_lib";

export async function POST(_request: Request, { params }: { params: Promise<{ userId: string }> }) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;
  const { userId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  if (error || !data.user?.email) return NextResponse.json({ error: error?.message ?? "Usuario no encontrado" }, { status: 404 });
  if (data.user.email_confirmed_at) return NextResponse.json({ error: "El correo ya fue confirmado" }, { status: 409 });
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error: resendError } = await admin.auth.resend({ type: "signup", email: data.user.email, options: { emailRedirectTo: `${base}/login` } });
  if (resendError) return NextResponse.json({ error: resendError.message }, { status: 500 });
  await admin.from("platform_activity_events" as never).insert({ actor_id: gate.user.id, action: "platform.verification_resent", entity_type: "user", entity_id: userId } as never);
  return NextResponse.json({ success: true });
}
