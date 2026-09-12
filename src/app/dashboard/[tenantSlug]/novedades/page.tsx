"use client";

import { useActiveTenant } from "@/stores/useTenantStore";
import { PageHeader } from "@/components/admin/PageHeader";
import { LoadingBlock } from "@/components/ui/LoadingBlock";
import { NOVEDADES } from "@/features/novedades/constants/catalog";
import { NovedadCard } from "@/features/novedades/components/NovedadCard";
import { useFeatureInterest } from "@/features/novedades/hooks/useFeatureInterest";

export default function NovedadesPage() {
  const tenant = useActiveTenant();
  const tenantId = tenant?.id ?? null;
  const { interested, isLoading, mutate } = useFeatureInterest(tenantId);

  if (!tenant) {
    return (
      <div className="text-sm text-muted-foreground">
        Selecciona un negocio para continuar.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="Lo que viene"
        title="Novedades"
        description="Estamos construyendo más para tu negocio. Dinos qué te interesa y te avisaremos apenas esté listo — tu voto nos ayuda a decidir qué hacer primero."
      />

      {isLoading ? (
        <LoadingBlock message="Cargando novedades…" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {NOVEDADES.map((n) => (
            <NovedadCard
              key={n.key}
              novedad={n}
              tenantId={tenant.id}
              alreadyInterested={interested.includes(n.key)}
              onInterested={() => mutate()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
