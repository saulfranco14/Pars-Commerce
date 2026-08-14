import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { resolveUserError } from "@/lib/errors/resolveUserError";
import { ORDER_PERMISSIONS } from "@/features/orders/constants/orderPermissions";

interface RequestBody {
  tenant_id: string;
  accepting_orders: boolean;
}

/**
 * Abre o cierra la recepción de pedidos del sitio público.
 *
 * No apaga la tienda: `public_store_enabled` sigue como esté y el catálogo se
 * sigue viendo. Lo único que cambia es que el checkout deja de aceptar.
 */
export async function PATCH(request: Request) {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!body.tenant_id || typeof body.accepting_orders !== "boolean") {
    return NextResponse.json(
      { error: "tenant_id y accepting_orders son requeridos" },
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
    body.tenant_id,
    ORDER_PERMISSIONS.scheduleConfig,
  );
  if (!permission) {
    return NextResponse.json(
      {
        error:
          "Solo el propietario del negocio puede abrir o cerrar la recepción de pedidos.",
      },
      { status: 403 },
    );
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("is_demo")
    .eq("id", body.tenant_id)
    .maybeSingle();
  if (body.accepting_orders && tenant?.is_demo) {
    return NextResponse.json(
      { error: "Los negocios demo son sólo de consulta y no pueden recibir pedidos." },
      { status: 403 },
    );
  }
  const { error } = await admin
    .from("tenants")
    .update({ accepting_orders: body.accepting_orders })
    .eq("id", body.tenant_id);

  if (error) {
    return NextResponse.json(
      { error: resolveUserError(error, "supabase") },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
    accepting_orders: body.accepting_orders,
  });
}
