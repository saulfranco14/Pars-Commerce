/* eslint-disable @typescript-eslint/no-explicit-any -- Commerce schema types are regenerated after the migration rollout. */
import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import CarritoContent from "./CarritoContent";
import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { readPickupScheduling } from "@/features/checkout/helpers/pickupSchedule";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import type { PublicCheckoutOptions } from "@/features/checkout/components/cart/CheckoutFulfillmentStep";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CarritoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, settings, accepting_orders, whatsapp_orders_enabled")
    .eq("site_slug", slug)
    .eq("public_store_enabled", true)
    .single();

  if (tenantError || !tenant) {
    notFound();
  }

  const accentColor = tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT;
  const settings = (tenant.settings as Record<string, unknown> | null) ?? {};
  const recurringConfig = {
    ...DEFAULT_RECURRING_CONFIG,
    ...((settings.recurring_purchases as Partial<RecurringPurchasesConfig>) ?? {}),
  };
  const pickupScheduling = readPickupScheduling(settings);
  const businessHours = readBusinessHours(settings);
  // `!== false` y no `=== true`: si la columna todavía no llegó a esta fila,
  // el negocio sigue recibiendo. Cerrar la recepción es una decisión que
  // alguien toma, no un valor por omisión.
  const acceptingOrders = tenant.accepting_orders !== false;
  const commerce = supabase as unknown as { from: (table: string) => any };
  const [{ data: fulfillment }, { data: pickupPoints }, { data: paymentMethods }, { data: onlineConnection }] = await Promise.all([
    commerce.from("tenant_fulfillment_settings").select("delivery_enabled, delivery_fee, delivery_area_label, pickup_enabled, online_payment_enabled").eq("tenant_id", tenant.id).maybeSingle(),
    commerce.from("tenant_pickup_points").select("id, name, address_text, reference, instructions, latitude, longitude, mapbox_feature_id, business_hours").eq("tenant_id", tenant.id).eq("is_active", true).order("is_primary", { ascending: false }),
    commerce.from("tenant_payment_methods").select("kind, is_active").eq("tenant_id", tenant.id).eq("is_active", true),
    commerce.from("payment_provider_connections").select("status").eq("tenant_id", tenant.id).eq("provider", "mercadopago").maybeSingle(),
  ]);
  const resolvedPickupPoints = (pickupPoints ?? []).map((point: Record<string, unknown>) => ({
    ...point,
    // A point without its own schedule follows the official business hours.
    // Resolving it here keeps the public component presentation-only.
    business_hours: point.business_hours ?? businessHours,
  })) as PublicCheckoutOptions["pickupPoints"];
  const checkoutOptions: PublicCheckoutOptions = { deliveryEnabled: Boolean(fulfillment?.delivery_enabled), deliveryFee: Number(fulfillment?.delivery_fee ?? 0), deliveryAreaLabel: fulfillment?.delivery_area_label ?? null, pickupEnabled: fulfillment ? Boolean(fulfillment.pickup_enabled) : true, pickupPoints: resolvedPickupPoints, onlinePaymentEnabled: Boolean(fulfillment?.online_payment_enabled) && onlineConnection?.status === "connected", transferEnabled: Boolean((paymentMethods ?? []).find((method: { kind: string }) => method.kind === "bank_transfer")), cashEnabled: Boolean((paymentMethods ?? []).find((method: { kind: string }) => method.kind === "cash")) };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm"
          style={{ backgroundColor: accentColor }}
        >
          <ShoppingCart className="h-6 w-6" aria-hidden />
        </div>
        <div>
          <h1 className="site-canvas-heading text-2xl font-bold tracking-tight">Carrito</h1>
          <p className="site-canvas-copy mt-0.5 text-sm">Revisa tu pedido y finaliza</p>
        </div>
      </div>
      <CarritoContent
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={accentColor}
        recurringConfig={recurringConfig}
        pickupScheduling={pickupScheduling}
        businessHours={businessHours}
        acceptingOrders={acceptingOrders}
        whatsappOrdersEnabled={tenant.whatsapp_orders_enabled === true}
        checkoutOptions={checkoutOptions}
      />
    </div>
  );
}
