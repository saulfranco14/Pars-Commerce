"use client";

import { Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PlanWizard } from "@/features/planes/components/wizard/PlanWizard";

function NewPlan() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const tenant = useActiveTenant();
  const listUrl = `/dashboard/${tenantSlug}/promociones?vista=suscripciones`;

  if (!tenant) return null;
  return (
    <PlanWizard
      tenantId={tenant.id}
      businessType={tenant.business_type}
      templateKey={searchParams.get("template")}
      onClose={() => router.push(listUrl)}
      onSaved={() => router.push(listUrl)}
    />
  );
}

export default function NuevoPlanPage() {
  return (
    <Suspense fallback={null}>
      <NewPlan />
    </Suspense>
  );
}
