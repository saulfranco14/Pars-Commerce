import { notFound } from "next/navigation";
import { Repeat } from "lucide-react";

import { PlanCard } from "@/features/sitio/components/plans/PlanCard";
import { StoreEmptyState } from "@/features/sitio/components/StoreEmptyState";
import { StorePageHeader } from "@/features/sitio/components/StorePageHeader";

import { catalogHref } from "@/features/sitio/helpers/storeLinks";
import { getActivePlans, getStoreTenant } from "@/features/sitio/services/storefrontService";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Suscripciones" };

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PlanesPage({ params }: PageProps) {
  const { slug } = await params;
  const tenant = await getStoreTenant(slug);
  if (!tenant) notFound();

  const plans = await getActivePlans(tenant.id);

  return (
    <div className="space-y-10 sm:space-y-14">
      <StorePageHeader
        title="Suscripciones"
        description={plans.length > 0 ? "Paga el primer periodo hoy y recibe lo mismo cada periodo, sin volver a pedirlo." : undefined}
      />

      {plans.length === 0 ? (
        <StoreEmptyState
          icon={Repeat}
          title="Aún no hay suscripciones"
          description="Vuelve pronto o explora el catálogo completo."
          action={{ href: catalogHref(slug), label: "Ver catálogo" }}
        />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <li key={plan.id}>
              <PlanCard plan={plan} tenantId={tenant.id} slug={slug} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
