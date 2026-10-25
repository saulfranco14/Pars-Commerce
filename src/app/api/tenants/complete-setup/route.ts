import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { normalizeMexicanPhone } from "@/lib/phone";
import { asLegalAdmin, hasTenantLegalAcceptance } from "@/features/legal/legalActivation";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json() as { tenant_id?: string };
  if (!body.tenant_id) return NextResponse.json({ error: "tenant_id is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: membership } = await admin
    .from("tenant_memberships")
    .select("status, role:tenant_roles(name)")
    .eq("tenant_id", body.tenant_id)
    .eq("user_id", user.id)
    .maybeSingle();
  const rawRole = membership?.role as { name?: string } | { name?: string }[] | null | undefined;
  const role = Array.isArray(rawRole) ? rawRole[0] : rawRole;
  if (!membership || membership.status !== "active" || role?.name !== "owner") {
    return NextResponse.json({ error: "Sólo el propietario puede terminar la preparación." }, { status: 403 });
  }

  const legalAcceptance = await hasTenantLegalAcceptance(asLegalAdmin(admin), body.tenant_id);
  if (!legalAcceptance) {
    return NextResponse.json({ error: "Completa los datos legales y acepta el acuerdo de Tlaco antes de abrir pedidos." }, { status: 403 });
  }

  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug, whatsapp_phone, settings, catalog_review_status")
    .eq("id", body.tenant_id)
    .maybeSingle();
  if (!tenant) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
  if (!tenant.whatsapp_phone || !normalizeMexicanPhone(tenant.whatsapp_phone)) {
    return NextResponse.json({ error: "Confirma un WhatsApp mexicano válido antes de abrir pedidos." }, { status: 400 });
  }

  const { data: products, error: productsError } = await admin
    .from("products")
    .select("id, type, price, track_stock")
    .eq("tenant_id", body.tenant_id)
    .eq("is_public", true)
    .is("deleted_at", null);
  if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });
  const activeItems = products ?? [];
  const physicalCount = activeItems.filter((item) => item.type === "product").length;
  const serviceCount = activeItems.filter((item) => item.type === "service").length;
  if ((physicalCount > 0 && physicalCount < 3) || (physicalCount === 0 && serviceCount < 1)) {
    return NextResponse.json({ error: "Publica al menos tres productos o un servicio para continuar." }, { status: 400 });
  }
  if (activeItems.some((item) => Number(item.price) <= 0)) {
    return NextResponse.json({ error: "Todos los artículos publicados necesitan un precio mayor a cero." }, { status: 400 });
  }

  const currentSettings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const onboarding = (currentSettings.onboarding as Record<string, unknown> | null) ?? {};
  if (onboarding.contact_completed !== true || !onboarding.fulfillment) {
    return NextResponse.json({ error: "Confirma el contacto y la forma de atención antes de abrir pedidos." }, { status: 400 });
  }
  if (!onboarding.payment_method || onboarding.customer_preview_completed !== true) {
    return NextResponse.json({ error: "Completa el cobro y la prueba como cliente antes de abrir pedidos." }, { status: 400 });
  }

  if (tenant.catalog_review_status === "pending") {
    const { error: approvalError } = await admin.rpc("approve_initial_catalog" as never, {
      p_tenant_id: body.tenant_id,
      p_actor_id: user.id,
      p_acceptance_source: "dashboard",
      p_note: "Aprobado durante la preparación guiada",
    } as never) as { error: { message: string } | null };
    if (approvalError) return NextResponse.json({ error: approvalError.message }, { status: 400 });
  }

  const completedAt = new Date().toISOString();
  const { error: updateError } = await admin
    .from("tenants")
    .update({
      public_store_enabled: true,
      accepting_orders: true,
      whatsapp_orders_enabled: true,
      settings: {
        ...currentSettings,
        onboarding: {
          ...onboarding,
          status: "active",
          completed_steps: ["contact", "catalog", "availability", "payment", "customer_preview"],
          completed_at: completedAt,
        },
      },
      updated_at: completedAt,
    } as never)
    .eq("id", body.tenant_id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ success: true, slug: tenant.slug, accepting_orders: true });
}
