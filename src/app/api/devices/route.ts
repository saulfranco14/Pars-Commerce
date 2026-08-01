import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { DEVICE_PERMISSIONS } from "@/features/dispositivos/constants/devicePermissions";
import { listDevices } from "@/features/dispositivos/services/deviceService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";

/**
 * Lista las pantallas del negocio: las pendientes de aprobar y las activas.
 * Las pantallas NO se dan de alta desde aquí — se anuncian ellas al abrirse
 * (`/api/devices/enroll`) y el dueño aprueba.
 */
export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) {
    return NextResponse.json(
      { error: "tenant_id es requerido" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const permission = await requirePermission(
    user.id,
    tenantId,
    DEVICE_PERMISSIONS.manage,
  );
  if (!permission) {
    return NextResponse.json(
      {
        error:
          "Solo el propietario del negocio puede administrar las pantallas.",
      },
      { status: 403 },
    );
  }

  const result = await listDevices(createAdminClient(), tenantId);
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json(result.data);
}
