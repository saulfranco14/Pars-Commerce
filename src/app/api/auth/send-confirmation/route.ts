import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

    const supabase = createAdminClient();

    // El alta no depende de SendGrid. Auth queda confirmado para permitir
    // iniciar sesión; la aprobación diferida se guarda en el perfil de Tlaco.
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (error) {
      return NextResponse.json(
        { error: resolveUserError(error, "supabase") },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating confirmation request:", error);
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") || resolveUserError(error, null) },
      { status: 500 },
    );
  }
}
