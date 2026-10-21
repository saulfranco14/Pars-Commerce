"use client";

import { useParams, useRouter } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { OfferWizard } from "@/features/promociones/components/wizard/OfferWizard";

export default function EditarPromocionPage() {
  const router = useRouter();
  const { tenantSlug, offerId } = useParams<{ tenantSlug: string; offerId: string }>();
  const tenant = useActiveTenant();
  const listUrl = `/dashboard/${tenantSlug}/promociones`;

  if (!tenant) return null;
  return (
    <OfferWizard
      tenantId={tenant.id}
      businessType={tenant.business_type}
      promotionId={offerId}
      onClose={() => router.push(listUrl)}
      onSaved={() => router.push(listUrl)}
    />
  );
}
