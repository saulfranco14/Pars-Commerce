import { createHash } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export function normalizeMxPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return digits.startsWith("52") ? `+${digits}` : `+52${digits}`;
}

export function hashDeviceFingerprint(fingerprint: string): string {
  return createHash("sha256").update(fingerprint).digest("hex");
}

export async function identifyCustomer(input: {
  admin: SupabaseClient;
  tenantId: string;
  displayName: string;
  phone: string;
  fingerprint: string;
}) {
  const normalizedPhone = normalizeMxPhone(input.phone);
  if (!normalizedPhone) return { error: "Escribe un teléfono válido de 10 dígitos" as const };
  const now = new Date().toISOString();
  const deviceHash = hashDeviceFingerprint(input.fingerprint);
  const { data: existing } = await input.admin
    .from("customers")
    .select("id, name, phone")
    .eq("tenant_id", input.tenantId)
    .eq("normalized_phone", normalizedPhone)
    .maybeSingle() as unknown as { data: { id: string; name: string; phone: string | null } | null };
  let customer = existing;
  if (!customer) {
    const { data, error } = await input.admin.from("customers").insert({
      tenant_id: input.tenantId,
      name: input.displayName.trim(),
      phone: input.phone.trim(),
      normalized_phone: normalizedPhone,
      identity_consent_at: now,
      last_seen_at: now,
    } as never).select("id, name, phone").single();
    if (error || !data) return { error: error?.message ?? "No se pudo registrar al cliente" as const };
    customer = data as unknown as { id: string; name: string; phone: string | null };
  } else {
    await input.admin.from("customers").update({ name: input.displayName.trim() || customer.name, last_seen_at: now, updated_at: now } as never).eq("id", customer.id);
  }
  const { data: existingDevice } = await input.admin.from("customer_devices" as never)
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("device_hash", deviceHash)
    .is("revoked_at", null)
    .maybeSingle() as unknown as { data: { id: string } | null };
  if (existingDevice) {
    await input.admin.from("customer_devices" as never).update({ customer_id: customer.id, last_seen_at: now, updated_at: now } as never).eq("id", existingDevice.id);
  } else {
    await input.admin.from("customer_devices" as never).insert({ tenant_id: input.tenantId, customer_id: customer.id, device_hash: deviceHash, last_seen_at: now } as never);
  }
  return { customer, normalizedPhone, deviceHash };
}
