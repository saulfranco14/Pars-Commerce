import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEVICE_COOKIE,
  deviceTokenMatches,
  hashDeviceToken,
} from "@/features/dispositivos/helpers/deviceToken";

import type { AuthenticatedDevice } from "@/features/dispositivos/interfaces/device";

/**
 * Espejo de `requirePermission` para pantallas sin sesión de usuario.
 * Devuelve `null` si no hay token, no existe, o el negocio la revocó.
 */
export async function requireDevice(): Promise<AuthenticatedDevice | null> {
  const store = await cookies();
  const token = store.get(DEVICE_COOKIE)?.value?.trim();
  if (!token) return null;

  const admin = createAdminClient();
  const { data: device } = await admin
    .from("tenant_devices")
    .select("id, tenant_id, name, kind, token_hash, status")
    .eq("token_hash", hashDeviceToken(token))
    .maybeSingle();

  if (!device?.token_hash) return null;
  if (device.status !== "approved") return null;
  if (!deviceTokenMatches(token, device.token_hash)) return null;

  // No se espera: que el latido falle no debe tumbar la petición.
  void admin
    .from("tenant_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);

  return {
    deviceId: device.id,
    tenantId: device.tenant_id,
    name: device.name,
    kind: device.kind as AuthenticatedDevice["kind"],
  };
}
