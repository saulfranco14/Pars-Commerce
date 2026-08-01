import type { SupabaseClient } from "@supabase/supabase-js";

import {
  generateDeviceToken,
  generateEnrollCode,
  hashDeviceToken,
} from "@/features/dispositivos/helpers/deviceToken";

import { enrollKeyMatches } from "@/features/dispositivos/services/enrollKeyService";

import type {
  ClaimResult,
  EnrollDeviceInput,
  EnrollDeviceResult,
  TenantDevice,
} from "@/features/dispositivos/interfaces/device";
import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

function err(
  code: ServiceError["code"],
  message: string,
): { ok: false; error: ServiceError } {
  return { ok: false, error: { code, message } };
}

const PUBLIC_COLUMNS =
  "id, tenant_id, install_id, enroll_code, status, name, kind, user_agent, screen_info, requested_at, approved_at, claimed_at, last_seen_at, created_at";

/** Tope de solicitudes sin atender: evita que alguien llene el panel. */
const MAX_PENDING = 10;

/**
 * La pantalla se anuncia. Idempotente por `install_id`: recargar no genera
 * otra solicitud ni cambia el código que ya está mostrando.
 */
export async function enrollDevice(
  admin: SupabaseClient,
  input: EnrollDeviceInput,
): Promise<ServiceResult<EnrollDeviceResult>> {
  const installId = input.installId.trim();
  if (installId.length < 16 || installId.length > 64) {
    return err("validation", "Identificador de dispositivo inválido");
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, name, kiosk_enroll_key")
    .eq("slug", input.tenantSlug)
    .maybeSingle();

  if (!tenant) return err("not_found", "Negocio no encontrado");

  // Mismo mensaje que un negocio inexistente: distinguirlos permitiría
  // averiguar qué slugs existen probando claves.
  if (!enrollKeyMatches(tenant.kiosk_enroll_key, input.enrollKey)) {
    return err("forbidden", "Esta dirección no es válida");
  }

  const { data: existing } = await admin
    .from("tenant_devices")
    .select("id, status, enroll_code")
    .eq("tenant_id", tenant.id)
    .eq("install_id", installId)
    .maybeSingle();

  if (existing) {
    // Una pantalla rechazada que se reabre vuelve a la cola: el dueño pudo
    // haberla rechazado por error.
    if (existing.status === "rejected") {
      const code = generateEnrollCode();
      await admin
        .from("tenant_devices")
        .update({
          status: "pending",
          enroll_code: code,
          requested_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
      return {
        ok: true,
        data: { enrollCode: code, status: "pending", tenantName: tenant.name },
      };
    }
    return {
      ok: true,
      data: {
        enrollCode: existing.enroll_code,
        status: existing.status as EnrollDeviceResult["status"],
        tenantName: tenant.name,
      },
    };
  }

  const { count } = await admin
    .from("tenant_devices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .eq("status", "pending");

  if ((count ?? 0) >= MAX_PENDING) {
    return err(
      "conflict",
      "Hay demasiadas pantallas esperando aprobación. Pide al negocio que atienda las pendientes.",
    );
  }

  const enrollCode = generateEnrollCode();
  const { error } = await admin.from("tenant_devices").insert({
    tenant_id: tenant.id,
    install_id: installId,
    enroll_code: enrollCode,
    status: "pending",
    kind: "kiosk",
    user_agent: input.userAgent?.slice(0, 300) ?? null,
    screen_info: input.screenInfo?.slice(0, 60) ?? null,
  });

  if (error) return err("internal", error.message);

  return {
    ok: true,
    data: { enrollCode, status: "pending", tenantName: tenant.name },
  };
}

/**
 * La pantalla pregunta si ya la aprobaron. El token se acuña aquí, la primera
 * vez que lo reclama, así que nunca queda guardado en claro esperando.
 */
export async function claimDevice(
  admin: SupabaseClient,
  tenantSlug: string,
  installId: string,
): Promise<ServiceResult<ClaimResult>> {
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, name")
    .eq("slug", tenantSlug)
    .maybeSingle();

  if (!tenant) return err("not_found", "Negocio no encontrado");

  const { data: device } = await admin
    .from("tenant_devices")
    .select("id, status, enroll_code, name, token_hash")
    .eq("tenant_id", tenant.id)
    .eq("install_id", installId.trim())
    .maybeSingle();

  if (!device) return err("not_found", "Esta pantalla no está registrada");

  if (device.status === "rejected") {
    return { ok: true, data: { state: "rejected" } };
  }
  if (device.status !== "approved") {
    return {
      ok: true,
      data: { state: "pending", enrollCode: device.enroll_code },
    };
  }

  const ready = {
    state: "ready" as const,
    deviceId: device.id,
    deviceName: device.name,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    tenantName: tenant.name,
  };

  // Ya reclamó antes: el token vive en su cookie, no se vuelve a emitir.
  if (device.token_hash) {
    return { ok: true, data: { ...ready, token: null } };
  }

  const token = generateDeviceToken();
  const now = new Date().toISOString();
  const { error } = await admin
    .from("tenant_devices")
    .update({
      token_hash: hashDeviceToken(token),
      claimed_at: now,
      last_seen_at: now,
      updated_at: now,
    })
    .eq("id", device.id)
    .is("token_hash", null);

  if (error) return err("internal", error.message);

  return { ok: true, data: { ...ready, token } };
}

export async function listDevices(
  admin: SupabaseClient,
  tenantId: string,
): Promise<ServiceResult<TenantDevice[]>> {
  const { data, error } = await admin
    .from("tenant_devices")
    .select(PUBLIC_COLUMNS)
    .eq("tenant_id", tenantId)
    .order("requested_at", { ascending: false });

  if (error) return err("internal", error.message);
  return { ok: true, data: (data ?? []) as TenantDevice[] };
}

/** `Pantalla 3` — el dueño no sabe dónde va la pantalla hasta que la ve andando. */
async function nextDefaultName(admin: SupabaseClient, tenantId: string) {
  const { count } = await admin
    .from("tenant_devices")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("status", "approved");
  return `Pantalla ${(count ?? 0) + 1}`;
}

export async function approveDevice(
  admin: SupabaseClient,
  tenantId: string,
  deviceId: string,
  name: string,
  actorUserId: string,
): Promise<ServiceResult<TenantDevice>> {
  if (name.trim().length > 60) {
    return err("validation", "El nombre no puede pasar de 60 caracteres");
  }
  const trimmed = name.trim() || (await nextDefaultName(admin, tenantId));

  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("tenant_devices")
    .update({
      status: "approved",
      name: trimmed,
      approved_at: now,
      approved_by: actorUserId,
      updated_at: now,
    })
    .eq("id", deviceId)
    .eq("tenant_id", tenantId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();

  if (error) return err("internal", error.message);
  if (!data) return err("not_found", "No encontramos esa pantalla");
  return { ok: true, data: data as TenantDevice };
}

export async function renameDevice(
  admin: SupabaseClient,
  tenantId: string,
  deviceId: string,
  name: string,
): Promise<ServiceResult<TenantDevice>> {
  const trimmed = name.trim();
  if (!trimmed) return err("validation", "Ponle un nombre a la pantalla");
  if (trimmed.length > 60) {
    return err("validation", "El nombre no puede pasar de 60 caracteres");
  }

  const { data, error } = await admin
    .from("tenant_devices")
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq("id", deviceId)
    .eq("tenant_id", tenantId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();

  if (error) return err("internal", error.message);
  if (!data) return err("not_found", "No encontramos esa pantalla");
  return { ok: true, data: data as TenantDevice };
}

/**
 * Rechaza o revoca. Borra el `token_hash`, así que la pantalla queda muerta al
 * instante y tiene que volver a pedir permiso.
 */
export async function rejectDevice(
  admin: SupabaseClient,
  tenantId: string,
  deviceId: string,
): Promise<ServiceResult<TenantDevice>> {
  const now = new Date().toISOString();
  const { data, error } = await admin
    .from("tenant_devices")
    .update({
      status: "rejected",
      token_hash: null,
      claimed_at: null,
      updated_at: now,
    })
    .eq("id", deviceId)
    .eq("tenant_id", tenantId)
    .select(PUBLIC_COLUMNS)
    .maybeSingle();

  if (error) return err("internal", error.message);
  if (!data) return err("not_found", "No encontramos esa pantalla");
  return { ok: true, data: data as TenantDevice };
}

export async function deleteDevice(
  admin: SupabaseClient,
  tenantId: string,
  deviceId: string,
): Promise<ServiceResult<{ id: string }>> {
  const { data, error } = await admin
    .from("tenant_devices")
    .delete()
    .eq("id", deviceId)
    .eq("tenant_id", tenantId)
    .select("id")
    .maybeSingle();

  if (error) return err("internal", error.message);
  if (!data) return err("not_found", "No encontramos esa pantalla");
  return { ok: true, data: { id: deviceId } };
}
