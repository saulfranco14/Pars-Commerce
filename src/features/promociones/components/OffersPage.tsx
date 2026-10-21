"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { useActiveTenant, usePermission } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { FAB } from "@/components/ui/FAB";
import { FilterTabs } from "@/components/ui/FilterTabs";
import { PlansPanel } from "@/features/planes/components/PlansPanel";
import { PromotionsPanel } from "@/features/promociones/components/PromotionsPanel";

import { pageHeaderCta } from "@/components/admin/actionButtonClasses";

const VIEWS = [
  { value: "promociones", label: "Promociones" },
  { value: "suscripciones", label: "Suscripciones" },
];

export function OffersPage({ tenantSlug }: { tenantSlug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tenant = useActiveTenant();
  const can = usePermission();
  const canWrite = can("promotions.write");

  const view = searchParams.get("vista") === "suscripciones" ? "suscripciones" : "promociones";
  const base = `/dashboard/${tenantSlug}/promociones`;
  const createHref = view === "suscripciones" ? `${base}/planes/nueva` : `${base}/nueva`;
  const createLabel = view === "suscripciones" ? "Crear suscripción" : "Crear promoción";

  if (!tenant) return <p className="text-sm text-muted-foreground">Selecciona un negocio para continuar.</p>;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Promociones y planes"
        description="Descuentos, 2x1, paquetes y suscripciones que tus clientes ven y compran en tu tienda en línea."
        action={
          canWrite ? (
            <Link href={createHref} className={`${pageHeaderCta} hidden md:inline-flex`}>
              <Plus className="h-4 w-4" aria-hidden />
              {createLabel}
            </Link>
          ) : null
        }
      />

      <FilterTabs
        tabs={VIEWS}
        activeValue={view}
        onTabChange={(next) => router.replace(next === "suscripciones" ? `${pathname}?vista=suscripciones` : pathname)}
        ariaLabel="Qué quieres ver"
        density="touch"
      />

      {view === "suscripciones" ? (
        <PlansPanel tenant={tenant} base={base} canWrite={canWrite} />
      ) : (
        <PromotionsPanel tenant={tenant} base={base} canWrite={canWrite} />
      )}

      {canWrite ? (
        <FAB href={createHref} aria-label={createLabel}>
          <Plus className="h-6 w-6 shrink-0" />
        </FAB>
      ) : null}
    </div>
  );
}
