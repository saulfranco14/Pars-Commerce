import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sendgrid";
import { resetPasswordEmailTemplate } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/env/appUrl";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 },
      );
    }

    const trimmedEmail = email.trim();
    if (!EMAIL_REGEX.test(trimmedEmail)) {
      return NextResponse.json(
        { error: "Ingresa un email valido" },
        { status: 400 },
      );
    }

    const redirectUrl = `${getAppUrl()}/login`;
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: trimmedEmail,
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      return NextResponse.json({ success: true });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json({ success: true });
    }

    const recoveryUrl = actionLink.startsWith("http")
      ? actionLink
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${actionLink}`;

    await sendEmail({
      to: trimmedEmail,
      subject: "Restablece tu contraseña - Pars Commerce",
      html: resetPasswordEmailTemplate(recoveryUrl),
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
