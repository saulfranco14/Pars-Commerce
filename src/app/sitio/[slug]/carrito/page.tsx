import { notFound } from "next/navigation";

import CarritoContent from "./CarritoContent";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";

import { DEFAULT_RECURRING_CONFIG } from "@/types/subscriptions";
import { DEFAULT_TENANT_ACCENT } from "@/features/sitio-web/constants/templateStyles";
import { readPickupScheduling } from "@/features/checkout/helpers/pickupSchedule";
import { readBusinessHours } from "@/features/configuracion/helpers/businessHours";
import { getCheckoutOptions, getStoreTenant } from "@/features/sitio/services/storefrontService";

import type { RecurringPurchasesConfig } from "@/types/subscriptions";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const metadata: Metadata = { title: "Carrito" };

export default async function CarritoPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const settings = tenant.settings ?? {};
  const recurringConfig = {
    ...DEFAULT_RECURRING_CONFIG,
    ...((settings.recurring_purchases as Partial<RecurringPurchasesConfig>) ?? {}),
  };
  const checkoutOptions = await getCheckoutOptions(tenant);

  return (
    <div className="space-y-6">
      <StorePageHeader title="Carrito" description="Revisa tu pedido y elige cómo recibirlo." />
      <CarritoContent
        tenantId={tenant.id}
        sitioSlug={slug}
        accentColor={tenant.theme_color?.trim() || DEFAULT_TENANT_ACCENT}
        recurringConfig={recurringConfig}
        pickupScheduling={readPickupScheduling(settings)}
        businessHours={readBusinessHours(settings)}
        // `!== false`: if the column hasn't reached this row yet, the business keeps receiving.
        acceptingOrders={tenant.accepting_orders !== false}
        whatsappOrdersEnabled={tenant.whatsapp_orders_enabled === true}
        checkoutOptions={checkoutOptions}
      />
    </div>
  );
}
