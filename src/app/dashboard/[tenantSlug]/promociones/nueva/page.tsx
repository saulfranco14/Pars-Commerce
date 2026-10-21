"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { OfferWizard } from "@/features/promociones/components/wizard/OfferWizard";

function NewOffer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenant = useActiveTenant();
  const listUrl = `/dashboard/${tenantSlug}/promociones`;

  if (!tenant) return null;
  return (
    <OfferWizard
      tenantId={tenant.id}
      businessType={tenant.business_type}
      templateKey={searchParams.get("template")}
      onClose={() => router.push(listUrl)}
      onSaved={() => router.push(listUrl)}
    />
  );
}

export default function NuevaPromocionPage() {
  return (
    <Suspense fallback={null}>
      <NewOffer />
    </Suspense>
  );
}
