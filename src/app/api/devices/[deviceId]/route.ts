import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePermission } from "@/lib/auth/requirePermission";
import { DEVICE_PERMISSIONS } from "@/features/dispositivos/constants/devicePermissions";
import {
  approveDevice,
  deleteDevice,
  rejectDevice,
  renameDevice,
} from "@/features/dispositivos/services/deviceService";
import { serviceErrorToResponse } from "@/features/qr/services/serviceErrorToResponse";
import { asBillingAdmin, assertKioskCapacity, BillingCapabilityError } from "@/features/billing/billingService";

interface Params {
  params: Promise<{ deviceId: string }>;
}

// The tenant comes from the device row, never from the request: taking it from
// the body would let someone check the permission against another business.
async function authorize(deviceId: string) {
  const admin = createAdminClient();
  const { data: device } = await admin
    .from("tenant_devices")
    .select("tenant_id, status")
    .eq("id", deviceId)
    .maybeSingle();

  if (!device) {
    return {
      error: NextResponse.json(
        { error: "No encontramos esa pantalla" },
        { status: 404 },
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
    device.tenant_id,
    DEVICE_PERMISSIONS.manage,
  );
  if (!permission) {
    return {
      error: NextResponse.json(
        {
          error:
            "Solo el propietario del negocio puede administrar las pantallas.",
        },
        { status: 403 },
      ),
    };
  }

  return { tenantId: device.tenant_id as string, deviceStatus: device.status as string, admin, userId: user.id };
}

/** `{ action: "approve" | "reject" | "rename", name? }`. */
export async function PATCH(request: Request, { params }: Params) {
  const { deviceId } = await params;

  let body: { action?: "approve" | "reject" | "rename"; name?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const auth = await authorize(deviceId);
  if (auth.error) return auth.error;

  if (body.action === "approve") {
    try {
      if (auth.deviceStatus !== "approved") await assertKioskCapacity(asBillingAdmin(auth.admin), auth.tenantId as string);
    } catch (error) {
      if (error instanceof BillingCapabilityError) {
        return NextResponse.json({
          error: `Tu plan ${error.account.plan.name} permite ${error.account.plan.entitlements.active_kiosk_limit} kiosko(s) activo(s).`,
          code: "billing_kiosk_limit",
          billing: error.account,
        }, { status: 403 });
      }
      return NextResponse.json({ error: "No pudimos validar el límite de kioskos" }, { status: 500 });
    }
    const result = await approveDevice(
      auth.admin!,
      auth.tenantId as string,
      deviceId,
      body.name ?? "",
      auth.userId as string,
    );
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }

  if (body.action === "reject") {
    const result = await rejectDevice(
      auth.admin!,
      auth.tenantId as string,
      deviceId,
    );
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }

  if (body.action === "rename") {
    const result = await renameDevice(
      auth.admin!,
      auth.tenantId as string,
      deviceId,
      body.name ?? "",
    );
    if (!result.ok) return serviceErrorToResponse(result.error);
    return NextResponse.json(result.data);
  }

  return NextResponse.json(
    { error: "action debe ser approve, reject o rename" },
    { status: 400 },
  );
}

export async function DELETE(_request: Request, { params }: Params) {
  const { deviceId } = await params;

  const auth = await authorize(deviceId);
  if (auth.error) return auth.error;

  const result = await deleteDevice(
    auth.admin!,
    auth.tenantId as string,
    deviceId,
  );
  if (!result.ok) return serviceErrorToResponse(result.error);
  return NextResponse.json({ success: true });
}
