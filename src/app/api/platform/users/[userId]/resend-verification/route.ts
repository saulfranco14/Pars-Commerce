import { NextResponse } from "next/server";
import { confirmationEmailTemplate } from "@/lib/email/templates";
import { sendEmail } from "@/lib/email/sendgrid";
import { getAppUrl } from "@/lib/env/appUrl";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "../../../_lib";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  const gate = await requirePlatformAdmin();
  if ("error" in gate) return gate.error;

  const { userId } = await params;
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email;

  if (error || !email) {
    return NextResponse.json(
      { error: resolveUserError(error ?? "Usuario no encontrado", "supabase") },
      { status: 404 },
    );
  }
  if (data.user.email_confirmed_at) {
    return NextResponse.json({ error: "El correo ya fue confirmado" }, { status: 409 });
  }

  const { data: linkData, error: linkError } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: { redirectTo: `${getAppUrl()}/login` },
  });
  if (linkError || !linkData.properties?.action_link) {
    return NextResponse.json(
      { error: resolveUserError(linkError ?? "No se pudo generar el enlace", "supabase") },
      { status: 500 },
    );
  }

  try {
    await sendEmail({
      to: email,
      subject: "Activa tu cuenta - Tlaco",
      html: confirmationEmailTemplate(linkData.properties.action_link),
    });
  } catch (sendError) {
    return NextResponse.json(
      { error: resolveUserError(sendError, "sendgrid") },
      { status: 502 },
    );
  }

  await admin.from("platform_activity_events" as never).insert({
    actor_id: gate.user.id,
    action: "platform.verification_resent",
    entity_type: "user",
    entity_id: userId,
  } as never);

  return NextResponse.json({ success: true });
}
