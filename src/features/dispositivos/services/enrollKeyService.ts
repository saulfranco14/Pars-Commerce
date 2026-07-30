// The kiosk URL carries a secret so knowing the public slug isn't enough to
// even request enrollment. Rotating it kills every printed or saved link.
//
// Lives in its own column, not in `settings`: the config form rewrites the whole
// settings object from a stale copy, and `/api/tenants` ships settings to every
// member while managing screens is owner-only.

import { randomBytes } from "node:crypto";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ServiceError,
  ServiceResult,
} from "@/features/qr/services/tablePaymentService";

function generateKey(): string {
  return randomBytes(16).toString("hex");
}

async function write(
  admin: SupabaseClient,
  tenantId: string,
  key: string,
): Promise<ServiceError | null> {
  const { error } = await admin
    .from("tenants")
    .update({ kiosk_enroll_key: key })
    .eq("id", tenantId);
  return error ? { code: "internal", message: error.message } : null;
}

/** La devuelve, creándola la primera vez para que la URL siempre sirva. */
export async function getOrCreateEnrollKey(
  admin: SupabaseClient,
  tenantId: string,
): Promise<ServiceResult<{ key: string; slug: string }>> {
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, kiosk_enroll_key")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return {
      ok: false,
      error: { code: "not_found", message: "Negocio no encontrado" },
    };
  }

  const existing = tenant.kiosk_enroll_key;
  if (existing && existing.length >= 24) {
    return { ok: true, data: { key: existing, slug: tenant.slug } };
  }

  const key = generateKey();
  const err = await write(admin, tenantId, key);
  if (err) return { ok: false, error: err };
  return { ok: true, data: { key, slug: tenant.slug } };
}

/** Gira la clave: las direcciones viejas dejan de servir de inmediato. */
export async function rotateEnrollKey(
  admin: SupabaseClient,
  tenantId: string,
): Promise<ServiceResult<{ key: string; slug: string }>> {
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("id", tenantId)
    .maybeSingle();

  if (!tenant) {
    return {
      ok: false,
      error: { code: "not_found", message: "Negocio no encontrado" },
    };
  }

  const key = generateKey();
  const err = await write(admin, tenantId, key);
  if (err) return { ok: false, error: err };
  return { ok: true, data: { key, slug: tenant.slug } };
}

/** Compara en tiempo constante y sin filtrar por longitud. */
export function enrollKeyMatches(
  expected: string | null | undefined,
  provided: string | null | undefined,
): boolean {
  // Sin clave configurada nadie enrola: más seguro que dejarlo abierto.
  if (!expected || !provided) return false;
  if (expected.length !== provided.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return diff === 0;
}
