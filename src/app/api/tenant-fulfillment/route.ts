/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import type { BusinessHours } from "@/features/configuracion/interfaces/businessHours";

/**
 * These tables are introduced in the same release as this route.  The
 * generated Database type is refreshed by Supabase CI after the migration is
 * applied, so keep the boundary deliberately narrow instead of spreading
 * casts through the UI.
 */
type QueryResult = { data: any; error: { message: string } | null };
type TableQuery = {
  select: (columns: string) => TableQuery;
  eq: (column: string, value: string | boolean) => TableQuery;
  order: (column: string, options?: { ascending?: boolean }) => TableQuery;
  maybeSingle: () => Promise<QueryResult>;
  upsert: (value: Record<string, unknown>, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>;
  insert: (value: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  update: (value: Record<string, unknown>) => TableQuery;
  then: PromiseLike<QueryResult>["then"];
};
type Db = { from: (table: string) => TableQuery };

async function requireActiveMember(tenantId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401 as const };
  const { data: membership } = await supabase
    .from("tenant_memberships")
    .select("id, status")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!membership || membership.status !== "active") return { error: "Forbidden", status: 403 as const };
  return { supabase, user };
}

export async function GET(request: Request) {
  const tenantId = new URL(request.url).searchParams.get("tenant_id");
  if (!tenantId) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  const access = await requireActiveMember(tenantId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const db = access.supabase as unknown as Db;
  const [settings, points, methods, onlineConnection, tenant] = await Promise.all([
    db.from("tenant_fulfillment_settings").select("*").eq("tenant_id", tenantId).maybeSingle(),
    db.from("tenant_pickup_points").select("*").eq("tenant_id", tenantId).eq("is_active", true).order("is_primary", { ascending: false }),
    db.from("tenant_payment_methods").select("id, kind, label, bank_name, account_holder, clabe, account_number, is_active, display_order").eq("tenant_id", tenantId).order("display_order"),
    db.from("payment_provider_connections").select("status").eq("tenant_id", tenantId).eq("provider", "mercadopago").maybeSingle(),
    db.from("tenants").select("settings").eq("id", tenantId).maybeSingle(),
  ]);
  const tenantSettings = (tenant.data?.settings as Record<string, unknown> | null) ?? null;
  return NextResponse.json({ settings: settings.data ?? null, pickupPoints: points.data ?? [], paymentMethods: methods.data ?? [], onlinePaymentConnected: onlineConnection.data?.status === "connected", businessHours: readBusinessHours(tenantSettings) });
}

export async function PATCH(request: Request) {
  const body = await request.json() as {
    tenant_id?: string;
    delivery_enabled?: boolean;
    online_payment_enabled?: boolean;
    delivery_fee?: number;
    delivery_area_label?: string;
    pickup_enabled?: boolean;
    pickup_point?: { id?: string; name?: string; address_text?: string; reference?: string; instructions?: string; latitude?: number | null; longitude?: number | null; mapbox_feature_id?: string | null; business_hours?: BusinessHours | null } | null;
    pickup_points?: { id?: string; name?: string; address_text?: string; reference?: string; instructions?: string; latitude?: number | null; longitude?: number | null; mapbox_feature_id?: string | null; business_hours?: BusinessHours | null }[];
    transfer?: { id?: string; enabled?: boolean; label?: string; bank_name?: string; account_holder?: string; clabe?: string; account_number?: string } | null;
    cash_enabled?: boolean;
  };
  const tenantId = body.tenant_id;
  if (!tenantId) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });
  const access = await requireActiveMember(tenantId);
  if ("error" in access) return NextResponse.json({ error: access.error }, { status: access.status });
  const db = access.supabase as unknown as Db;
  const deliveryFee = Number(body.delivery_fee ?? 0);
  const deliveryArea = body.delivery_area_label?.trim() ?? "";
  if (body.delivery_enabled && (!Number.isFinite(deliveryFee) || deliveryFee < 0 || !deliveryArea)) {
    return NextResponse.json({ error: "La entrega requiere costo válido y zona de cobertura." }, { status: 400 });
  }
  // Accept the original singular field during the transition, while new
  // clients can configure every collection point in one save.
  const pickupPoints = body.pickup_points ?? (body.pickup_point ? [body.pickup_point] : []);
  if (body.pickup_enabled && (pickupPoints.length === 0 || pickupPoints.some((point) => !point.name?.trim() || !point.address_text?.trim()))) {
    return NextResponse.json({ error: "La recolección requiere nombre y dirección del punto." }, { status: 400 });
  }
  if (pickupPoints.some((point) => point.business_hours != null && readBusinessHours({ business_hours: point.business_hours }) === null)) {
    return NextResponse.json({ error: "Revisa el horario de cada punto de recolección." }, { status: 400 });
  }
  if (body.transfer?.enabled && (!body.transfer.bank_name?.trim() || !body.transfer.account_holder?.trim() || !/^\d{18}$/.test((body.transfer.clabe ?? "").replace(/\s/g, "")))) {
    return NextResponse.json({ error: "La transferencia requiere banco, titular y una CLABE de 18 dígitos." }, { status: 400 });
  }
  const now = new Date().toISOString();
  const { error: settingsError } = await db.from("tenant_fulfillment_settings").upsert({
    tenant_id: tenantId,
    // Older clients did not send this field; keep their existing online
    // checkout behavior instead of accidentally turning it off on save.
    online_payment_enabled: body.online_payment_enabled !== false,
    delivery_enabled: Boolean(body.delivery_enabled),
    delivery_fee: deliveryFee,
    delivery_area_label: deliveryArea || null,
    pickup_enabled: Boolean(body.pickup_enabled),
    updated_at: now,
  }, { onConflict: "tenant_id" });
  if (settingsError) return NextResponse.json({ error: settingsError.message }, { status: 500 });
  // Points are never deleted as part of a configuration save: removed points
  // are simply deactivated, preserving historical orders that reference them.
  await db.from("tenant_pickup_points").update({ is_primary: false, is_active: false, updated_at: now }).eq("tenant_id", tenantId);
  for (const [index, point] of pickupPoints.entries()) {
    const latitude = Number(point.latitude);
    const longitude = Number(point.longitude);
    const pointPayload = { tenant_id: tenantId, name: point.name?.trim() || "Punto de recolección", address_text: point.address_text?.trim() || "Sin dirección", reference: point.reference?.trim() || null, instructions: point.instructions?.trim() || null, latitude: Number.isFinite(latitude) ? latitude : null, longitude: Number.isFinite(longitude) ? longitude : null, mapbox_feature_id: point.mapbox_feature_id?.trim() || null, business_hours: point.business_hours ?? null, is_primary: index === 0, is_active: Boolean(body.pickup_enabled), updated_at: now };
    const result = point.id
      ? await db.from("tenant_pickup_points").update(pointPayload).eq("id", point.id).eq("tenant_id", tenantId)
      : await db.from("tenant_pickup_points").insert(pointPayload);
    if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  }
  if (body.transfer) {
    const transfer = body.transfer;
    // `bank_transfer` has required bank data at DB level.  Do not create a
    // blank disabled method just because the user has not configured it yet.
    if (transfer.enabled || transfer.id) {
      const transferPayload = transfer.enabled
        ? { tenant_id: tenantId, kind: "bank_transfer", label: transfer.label?.trim() || "Transferencia SPEI", bank_name: transfer.bank_name?.trim(), account_holder: transfer.account_holder?.trim(), clabe: transfer.clabe?.replace(/\s/g, ""), account_number: transfer.account_number?.trim() || null, is_active: true, updated_at: now }
        : { is_active: false, updated_at: now };
      const result = transfer.id
        ? await db.from("tenant_payment_methods").update(transferPayload).eq("id", transfer.id).eq("tenant_id", tenantId)
        : await db.from("tenant_payment_methods").insert(transferPayload);
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
    }
  }
  if (typeof body.cash_enabled === "boolean") {
    const { data: existingCash } = await db.from("tenant_payment_methods").select("id").eq("tenant_id", tenantId).eq("kind", "cash").maybeSingle();
    if (existingCash?.id) await db.from("tenant_payment_methods").update({ is_active: body.cash_enabled, updated_at: now }).eq("id", existingCash.id);
    else await db.from("tenant_payment_methods").insert({ tenant_id: tenantId, kind: "cash", label: "Efectivo al recoger", is_active: body.cash_enabled, display_order: 20 });
  }
  return NextResponse.json({ success: true });
}
