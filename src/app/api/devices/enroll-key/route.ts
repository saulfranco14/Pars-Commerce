import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { DEVICE_PERMISSIONS } from "@/features/dispositivos/constants/devicePermissions";
import {
  getOrCreateEnrollKey,
  rotateEnrollKey,
} from "@/features/dispositivos/services/enrollKeyService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

const FORBIDDEN =
  "Solo el propietario del negocio puede administrar las pantallas.";

async function authorize(tenantId: string | null) {
  if (!tenantId) {
    return {
      error: NextResponse.json(
        { error: "tenant_id es requerido" },
        { status: 400 },
      ),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const permission = await requirePermission(
    user.id,
    tenantId,
    DEVICE_PERMISSIONS.manage,
  );
  if (!permission) {
    return { error: NextResponse.json({ error: FORBIDDEN }, { status: 403 }) };
  }

  return { ok: true as const };
}

/** Dirección vigente del kiosco. La crea si es la primera vez. */
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  const auth = await authorize(tenantId);
  if (auth.error) return auth.error;

  const result = await getOrCreateEnrollKey(
    createAdminClient(),
    tenantId as string,
  );
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ key: result.data.key, slug: result.data.slug });
}

/** Gira la clave: las direcciones viejas dejan de servir. */
export async function POST(request: Request) {
  let body: { tenant_id?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const auth = await authorize(body.tenant_id ?? null);
  if (auth.error) return auth.error;

  const result = await rotateEnrollKey(
    createAdminClient(),
    body.tenant_id as string,
  );
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ key: result.data.key, slug: result.data.slug });
}
