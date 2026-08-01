import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { DEVICE_COOKIE } from "@/features/dispositivos/helpers/deviceToken";
import {
  claimDevice,
  enrollDevice,
} from "@/features/dispositivos/services/deviceService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

const MAX_ATTEMPTS = 30;
const WINDOW_MS = 60_000;
const attempts = new Map<string, { count: number; resetAt: number }>();

// Freno por IP, por instancia. El peso real lo cargan el tope de pendientes por
// negocio y que aprobar es manual.
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

function clientIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "desconocida"
  );
}

/**
 * La pantalla se anuncia al abrirse. Sin sesión a propósito: todavía no tiene
 * credenciales. Solo crea una solicitud pendiente — no da acceso a nada.
 */
export async function POST(request: Request) {
  if (rateLimited(clientIp(request))) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera un minuto." },
      { status: 429 },
    );
  }

  let body: {
    tenant_slug?: string;
    install_id?: string;
    enroll_key?: string;
    screen_info?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.tenant_slug || !body.install_id || !body.enroll_key) {
    return NextResponse.json(
      { error: "tenant_slug, install_id y enroll_key son requeridos" },
      { status: 400 },
    );
  }

  const result = await enrollDevice(createAdminClient(), {
    tenantSlug: body.tenant_slug,
    installId: body.install_id,
    enrollKey: body.enroll_key,
    userAgent: request.headers.get("user-agent"),
    screenInfo: body.screen_info ?? null,
  });

  if (!result.ok) return serviceErrorToResponse(result.error);

  return NextResponse.json({
    enroll_code: result.data.enrollCode,
    status: result.data.status,
    tenant_name: result.data.tenantName,
  });
}

/**
 * La pantalla pregunta si ya la aprobaron. Cuando sí, el token se acuña aquí y
 * se devuelve en cookie httpOnly; nunca en el cuerpo.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tenantSlug = searchParams.get("tenant_slug");
  const installId = searchParams.get("install_id");

  if (!tenantSlug || !installId) {
    return NextResponse.json(
      { error: "tenant_slug e install_id son requeridos" },
      { status: 400 },
    );
  }

  const result = await claimDevice(createAdminClient(), tenantSlug, installId);
  if (!result.ok) return serviceErrorToResponse(result.error);

  const claim = result.data;

  if (claim.state !== "ready") {
    return NextResponse.json(
      claim.state === "pending"
        ? { state: "pending", enroll_code: claim.enrollCode }
        : { state: "rejected" },
    );
  }

  const response = NextResponse.json({
    state: "ready",
    device_id: claim.deviceId,
    device_name: claim.deviceName,
    tenant_slug: claim.tenantSlug,
    tenant_name: claim.tenantName,
  });

  if (claim.token) {
    response.cookies.set({
      name: DEVICE_COOKIE,
      value: claim.token,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: YEAR_SECONDS,
    });
  }

  return response;
}
