"use client";

import { useParams, useRouter } from "next/navigation";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PlanWizard } from "@/features/planes/components/wizard/PlanWizard";

export default function EditarPlanPage() {
  const router = useRouter();
  const { tenantSlug, planId } = useParams<{ tenantSlug: string; planId: string }>();
  const tenant = useActiveTenant();
  const listUrl = `/dashboard/${tenantSlug}/promociones?vista=suscripciones`;

  if (!tenant) return null;
  return (
    <PlanWizard
      tenantId={tenant.id}
      businessType={tenant.business_type}
      planId={planId}
      onClose={() => router.push(listUrl)}
      onSaved={() => router.push(listUrl)}
    />
  );
}
