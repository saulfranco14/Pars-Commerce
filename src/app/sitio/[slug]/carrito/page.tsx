import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import CarritoContent from "./CarritoContent";
import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import type { RecurringPurchasesConfig } from "@/types/subscriptions";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { readPickupScheduling } from "@/features/checkout/helpers/pickupSchedule";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function CarritoPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, name, theme_color, settings, accepting_orders")
    .eq("slug", slug)
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
  // `!== false` y no `=== true`: si la columna todavía no llegó a esta fila,
  // el negocio sigue recibiendo. Cerrar la recepción es una decisión que
  // alguien toma, no un valor por omisión.
  const acceptingOrders = tenant.accepting_orders !== false;

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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Carrito</h1>
          <p className="mt-0.5 text-sm text-gray-500">Revisa tu pedido y finaliza</p>
        </div>
      </div>
      <CarritoContent
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={accentColor}
        recurringConfig={recurringConfig}
        pickupScheduling={pickupScheduling}
        acceptingOrders={acceptingOrders}
      />
    </div>
  );
}
