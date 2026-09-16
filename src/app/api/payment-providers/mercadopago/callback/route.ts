import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  completeMercadoPagoConnection,
  decryptOauthVerifier,
  enableMerchantPayments,
  findOAuthConnection,
} from "@/features/payment-providers/connectionService";
import { exchangeMercadoPagoAuthorizationCode } from "@/features/payment-providers/mercadoPagoProvider";

export const runtime = "nodejs";

function redirectUri(request: Request) {
  return process.env.MP_OAUTH_REDIRECT_URI ?? `${new URL(request.url).origin}/api/payment-providers/mercadopago/callback`;
}

function redirectToDashboard(request: Request, slug: string | null, outcome: "connected" | "error") {
  const url = new URL(slug ? `/dashboard/${slug}/configuracion` : "/dashboard", request.url);
  url.searchParams.set("payment_provider", outcome);
  return NextResponse.redirect(url);
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return NextResponse.json({ error: "La autorización de Mercado Pago está incompleta" }, { status: 400 });

  const admin = createAdminClient();
  let tenantSlug: string | null = null;
  try {
    const connection = await findOAuthConnection(admin, state);
    const { data: tenant } = await admin.from("tenants").select("slug").eq("id", connection.tenant_id).maybeSingle();
    tenantSlug = tenant?.slug ?? null;
    const tokens = await exchangeMercadoPagoAuthorizationCode({
      code,
      redirectUri: redirectUri(request),
      verifier: decryptOauthVerifier(connection),
    });
    await completeMercadoPagoConnection({ admin, connection, ...tokens });
    await enableMerchantPayments(admin, connection.tenant_id);
    return redirectToDashboard(request, tenantSlug, "connected");
  } catch (error) {
    console.error("Mercado Pago OAuth callback failed", error);
    return redirectToDashboard(request, tenantSlug, "error");
  }
}
