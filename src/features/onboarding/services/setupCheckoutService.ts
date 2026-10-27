/* eslint-disable @typescript-eslint/no-explicit-any -- tenant_fulfillment_settings, tenant_pickup_points and tenant_payment_methods are not in the generated Supabase types yet. */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  needsPickupAddress,
  normalizeClabe,
  setupCheckoutProblem,
} from "@/features/onboarding/helpers/setupCheckoutValidation";

import type { ServiceError, ServiceResult } from "@/features/qr/services/tablePaymentService";
import type {
  SetupCheckoutInput,
  SetupCheckoutSnapshot,
  SetupFulfillmentInput,
  SetupPaymentInput,
} from "@/features/onboarding/interfaces/setupCheckout";

type Db = { from: (table: string) => any };

const DEFAULT_SETTINGS = {
  online_payment_enabled: true,
  delivery_enabled: false,
  delivery_fee: 0,
  delivery_area_label: null as string | null,
  pickup_enabled: false,
};

const fail = (code: ServiceError["code"], message: string): { ok: false; error: ServiceError } => ({
  ok: false,
  error: { code, message },
});

function db(): Db {
  return createAdminClient() as unknown as Db;
}

async function currentSettings(client: Db, tenantId: string) {
  const { data } = await client
    .from("tenant_fulfillment_settings")
    .select("online_payment_enabled, delivery_enabled, delivery_fee, delivery_area_label, pickup_enabled")
    .eq("tenant_id", tenantId)
    .maybeSingle();
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

async function saveSettings(client: Db, tenantId: string, patch: Partial<typeof DEFAULT_SETTINGS>) {
  const settings = await currentSettings(client, tenantId);
  return client
    .from("tenant_fulfillment_settings")
    .upsert({ tenant_id: tenantId, ...settings, ...patch, updated_at: new Date().toISOString() }, { onConflict: "tenant_id" });
}

async function saveFulfillment(client: Db, tenantId: string, input: SetupFulfillmentInput): Promise<ServiceResult<null>> {
  if (input.fulfillment === "delivery") {
    const { error } = await saveSettings(client, tenantId, {
      delivery_enabled: true,
      delivery_fee: Number(input.delivery?.fee || 0),
      delivery_area_label: input.delivery?.area.trim() ?? null,
    });
    return error ? fail("internal", error.message) : { ok: true, data: null };
  }
  if (!needsPickupAddress(input.fulfillment)) return { ok: true, data: null };

  const point = input.pickupPoint ?? {};
  const [{ data: tenant }, { data: existing }] = await Promise.all([
    client.from("tenants").select("name").eq("id", tenantId).maybeSingle(),
    client
      .from("tenant_pickup_points")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const latitude = Number(point.latitude);
  const longitude = Number(point.longitude);
  const location = {
    address_text: point.address_text?.trim(),
    reference: point.reference?.trim() || null,
    latitude: Number.isFinite(latitude) ? latitude : null,
    longitude: Number.isFinite(longitude) ? longitude : null,
    mapbox_feature_id: point.mapbox_feature_id?.trim() || null,
    is_active: true,
    is_primary: true,
    updated_at: new Date().toISOString(),
  };
  // Re-running the wizard moves the primary point instead of piling up duplicates; its name stays the owner's.
  const pointResult = existing?.id
    ? await client.from("tenant_pickup_points").update(location).eq("id", existing.id).eq("tenant_id", tenantId)
    : await client.from("tenant_pickup_points").insert({ tenant_id: tenantId, name: tenant?.name ?? "Mi negocio", ...location });
  if (pointResult.error) return fail("internal", pointResult.error.message);
  const { error } = await saveSettings(client, tenantId, { pickup_enabled: true });
  return error ? fail("internal", error.message) : { ok: true, data: null };
}

async function upsertPaymentMethod(client: Db, tenantId: string, kind: "cash" | "bank_transfer", values: Record<string, unknown>) {
  const { data: existing } = await client
    .from("tenant_payment_methods")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("kind", kind)
    .maybeSingle();
  const payload = { ...values, is_active: true, updated_at: new Date().toISOString() };
  return existing?.id
    ? client.from("tenant_payment_methods").update(payload).eq("id", existing.id)
    : client.from("tenant_payment_methods").insert({ tenant_id: tenantId, kind, ...payload });
}

async function savePayment(client: Db, tenantId: string, input: SetupPaymentInput): Promise<ServiceResult<null>> {
  if (input.method === "cash") {
    const settings = await currentSettings(client, tenantId);
    // The storefront only offers cash on pickup; enabling it for a delivery-only business would still leave no way to pay.
    if (!settings.pickup_enabled) {
      return fail("validation", "El efectivo se cobra cuando recogen. Elige transferencia o pago digital para tus entregas.");
    }
    const { error } = await upsertPaymentMethod(client, tenantId, "cash", { label: "Efectivo al recoger", display_order: 20 });
    return error ? fail("internal", error.message) : { ok: true, data: null };
  }
  if (input.method === "transfer") {
    const transfer = input.transfer;
    if (!transfer) return fail("validation", "Completa los datos de la cuenta para transferencias.");
    const { error } = await upsertPaymentMethod(client, tenantId, "bank_transfer", {
      label: "Transferencia SPEI",
      bank_name: transfer.bank_name.trim(),
      account_holder: transfer.account_holder.trim(),
      clabe: normalizeClabe(transfer.clabe),
    });
    return error ? fail("internal", error.message) : { ok: true, data: null };
  }
  const { data: connection } = await client
    .from("payment_provider_connections")
    .select("status")
    .eq("tenant_id", tenantId)
    .eq("provider", "mercadopago")
    .maybeSingle();
  if (connection?.status !== "connected") {
    return fail("validation", "Conecta tu cuenta de Mercado Pago para cobrar en línea, o elige efectivo o transferencia.");
  }
  const { error } = await saveSettings(client, tenantId, { online_payment_enabled: true });
  return error ? fail("internal", error.message) : { ok: true, data: null };
}

/** Turns what the owner chose in the setup wizard into a checkout that can actually take an order. */
export async function saveSetupCheckout(tenantId: string, input: SetupCheckoutInput): Promise<ServiceResult<null>> {
  const problem = setupCheckoutProblem(input);
  if (problem) return fail("validation", problem);
  const client = db();
  return input.step === "fulfillment" ? saveFulfillment(client, tenantId, input) : savePayment(client, tenantId, input);
}

export async function getSetupCheckoutSnapshot(tenantId: string): Promise<ServiceResult<SetupCheckoutSnapshot>> {
  const client = db();
  const [settings, { data: point }, { data: transfer }, { data: connection }] = await Promise.all([
    currentSettings(client, tenantId),
    client
      .from("tenant_pickup_points")
      .select("id, name, address_text, reference, latitude, longitude, mapbox_feature_id")
      .eq("tenant_id", tenantId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("tenant_payment_methods")
      .select("bank_name, account_holder, clabe")
      .eq("tenant_id", tenantId)
      .eq("kind", "bank_transfer")
      .maybeSingle(),
    client
      .from("payment_provider_connections")
      .select("status")
      .eq("tenant_id", tenantId)
      .eq("provider", "mercadopago")
      .maybeSingle(),
  ]);
  return {
    ok: true,
    data: {
      pickupPoint: point ?? null,
      delivery: {
        area: settings.delivery_area_label ?? "",
        fee: settings.delivery_enabled ? String(settings.delivery_fee ?? "") : "",
      },
      transfer: {
        bank_name: transfer?.bank_name ?? "",
        account_holder: transfer?.account_holder ?? "",
        clabe: transfer?.clabe ?? "",
      },
      onlinePaymentConnected: connection?.status === "connected",
    },
  };
}
