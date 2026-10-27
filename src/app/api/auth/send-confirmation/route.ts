import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { PLAN_ORDER } from "@/features/billing/entitlements";
import { normalizeMexicanPhone } from "@/lib/phone";
import { HEARD_FROM_VALUES } from "@/features/auth/constants/heardFromOptions";

export async function POST(request: NextRequest) {
  try {
    const { email, password, intent } = await request.json() as {
      email?: string;
      password?: string;
      intent?: { plan?: string; giro?: string; solutionKey?: string; catalogKey?: string; businessName?: string; themeKey?: string; primaryGoals?: string[]; catalogStartMode?: string; onboardingSessionId?: string; phone?: string; assisted?: boolean; prospectToken?: string; heardFrom?: string };
    };

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email y password son requeridos" },
        { status: 400 },
      );
    }

    const phone = intent?.phone ? normalizeMexicanPhone(intent.phone) : null;
    if (!phone) {
      return NextResponse.json({ error: "Ingresa un WhatsApp mexicano de 10 dígitos." }, { status: 400 });
    }
    const prospectToken = typeof intent?.prospectToken === "string" ? intent.prospectToken.trim().slice(0, 64) : "";
    const heardFrom = typeof intent?.heardFrom === "string" && HEARD_FROM_VALUES.has(intent.heardFrom) ? intent.heardFrom : "";
    const registrationIntent = {
      plan: PLAN_ORDER.includes(intent?.plan as never) ? intent?.plan : "free",
      giro: intent?.giro?.slice(0, 48) ?? "otro",
      solution_key: intent?.solutionKey?.slice(0, 48) ?? null,
      catalog_key: intent?.catalogKey?.slice(0, 48) ?? null,
      business_name: intent?.businessName?.trim().slice(0, 80) || null,
      theme_key: intent?.themeKey?.slice(0, 32) ?? "tlaco",
      primary_goals: Array.isArray(intent?.primaryGoals) ? intent.primaryGoals.slice(0, 2) : [],
      catalog_start_mode: intent?.catalogStartMode ?? "starter",
      onboarding_session_id: intent?.onboardingSessionId?.slice(0, 80) ?? null,
      phone,
      assisted: Boolean(intent?.assisted),
      // Only present for growth signups, so every other signup keeps the same metadata.
      ...(prospectToken ? { prospect_token: prospectToken } : {}),
      ...(heardFrom ? { heard_from: heardFrom } : {}),
    };
    const supabase = createAdminClient();

    // El proveedor de Auth requiere esta marca administrativa para permitir el
    // acceso inmediato. No se usa como prueba de control del correo: la
    // verificación real será un flujo posterior y separado del contrato.
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { registration_intent: registrationIntent },
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
