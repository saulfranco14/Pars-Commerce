import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { requirePermission } from "@/lib/auth/requirePermission";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { beginMercadoPagoConnection } from "@/features/payment-providers/connectionService";
import { createMercadoPagoAuthorizationUrl } from "@/features/payment-providers/mercadoPagoProvider";

export const runtime = "nodejs";

const PAYMENTS_DISCLOSURE_VERSION = "merchant-payments-v1";

function urlSafeRandom(bytes: number) {
  return randomBytes(bytes).toString("base64url");
}

function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

function redirectUri(request: Request) {
  const configured = process.env.MP_OAUTH_REDIRECT_URI;
  const url = configured ?? `${new URL(request.url).origin}/api/payment-providers/mercadopago/callback`;
  if (process.env.NODE_ENV === "production" && !url.startsWith("https://")) {
    throw new Error("MP_OAUTH_REDIRECT_URI debe usar HTTPS en producción");
  }
  return url;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { tenant_id?: unknown; terms_version?: unknown } | null;
  const tenantId = typeof body?.tenant_id === "string" ? body.tenant_id : "";
  const termsVersion = typeof body?.terms_version === "string" ? body.terms_version : "";
  if (!tenantId || termsVersion !== PAYMENTS_DISCLOSURE_VERSION) {
    return NextResponse.json(
      { error: "Debes aceptar el anexo de cobros vigente para conectar Mercado Pago" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const membership = await requirePermission(user.id, tenantId, "settings.write");
  if (!membership || membership.roleName !== "owner") {
    return NextResponse.json({ error: "Solo el propietario puede conectar una cuenta de cobro" }, { status: 403 });
  }

  try {
    const state = urlSafeRandom(32);
    const verifier = urlSafeRandom(64);
    const callback = redirectUri(request);
    await beginMercadoPagoConnection({
      admin: createAdminClient(),
      tenantId,
      userId: user.id,
      state,
      verifier,
      termsVersion,
    });
    return NextResponse.json({
      authorization_url: createMercadoPagoAuthorizationUrl({
        redirectUri: callback,
        state,
        codeChallenge: pkceChallenge(verifier),
      }),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "No fue posible iniciar Mercado Pago" },
      { status: 500 },
    );
  }
}
