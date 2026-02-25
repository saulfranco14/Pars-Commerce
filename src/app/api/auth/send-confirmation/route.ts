import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/sendgrid";
import { confirmationEmailTemplate } from "@/lib/email/templates";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUrl } from "@/lib/env/appUrl";
import { resolveUserError } from "@/lib/errors/resolveUserError";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y password son requeridos" },
        { status: 400 },
      );
    }

    const redirectUrl = `${getAppUrl()}/login`;
    const supabase = createAdminClient();

    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: redirectUrl },
    });

    if (error) {
      return NextResponse.json(
        { error: resolveUserError(error, "supabase") },
        { status: 400 },
      );
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return NextResponse.json(
        { error: "No se pudo generar el link de confirmación" },
        { status: 500 },
      );
    }

    const confirmUrl = actionLink.startsWith("http")
      ? actionLink
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/${actionLink}`;

    await sendEmail({
      to: email,
      subject: "Confirma tu cuenta - Pars Commerce",
      html: confirmationEmailTemplate(confirmUrl),
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Error sending confirmation email:", error);
    return NextResponse.json(
      { error: resolveUserError(error, "sendgrid") || resolveUserError(error, null) },
      { status: 500 },
    );
  }
}
